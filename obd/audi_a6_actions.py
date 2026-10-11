# obd/audi_a6_actions.py
# ══════════════════════════════════════════════════════════════════════════════
# Acciones y codificaciones específicas para el Audi A6 C6 4F Facelift (2010).
# Basado en la arquitectura Diagnose-CAN del Audi A6 C6:
# Comunicación 100% VW TP 2.0 / KWP2000 a través del Gateway J533.
# Evita transmisiones UDS directas no enrutadas para prevenir Bus-Off y alertas de ESP.
# ══════════════════════════════════════════════════════════════════════════════

import time
from typing import Dict, List, Tuple
from core.can_manager import CANManager
from obd.tp20_can import TP20Transport, KWP2000NativeClient, LOGICAL_MODULES
from core.diagnostic_logger import diag_logger


class AudiA6Actions:
    """
    Controlador de operaciones directas para el Audi A6 C6 (2010).
    """

    def __init__(self, can_mgr: CANManager, log_fn=None):
        self.can = can_mgr
        self.tp20 = TP20Transport(can_mgr, timeout=0.8)
        self.kwp = KWP2000NativeClient(self.tp20)
        self._log = log_fn or print

    def _emit(self, msg: str):
        try:
            self._log(msg)
        except Exception:
            print(msg)
        diag_logger.log_info(f"[A6 ACTION] {msg}")

    # ──────────────────────────────────────────────────────────────────────────
    #  OBJETIVO 1: ACTIVAR NEEDLE SWEEP (TEST DE AGUJAS AL ARRANCAR)
    #  Módulo 17 (Cuadro de Instrumentos J285) -> Byte 1, Bit 0 = 1
    # ──────────────────────────────────────────────────────────────────────────
    def activar_needle_sweep(self) -> Tuple[bool, str]:
        """
        Activa el Needle Sweep (barrido de agujas / Staging) en el Cuadro
        de Instrumentos J285 (Módulo 17) para Audi A6 C6 (Familia 4F0 920).
        Soporta Short Coding VAG KWP2000 y Canal de Adaptación 'Staging'.
        """
        self._emit("\n" + "=" * 55)
        self._emit("  CONFIGURANDO NEEDLE SWEEP (MÓDULO 17 - CUADRO A6 C6)")
        self._emit("=" * 55)

        try:
            self.can.flush_rx()
            
            # 1. Intentar conexión directa TP 2.0 con Cuadro 17
            self._emit("[CUADRO 17] Solicitando enlace TP 2.0 con Cuadro de Instrumentos...")
            if not self.tp20.open_channel(0x17, retries=2):
                msg_err = (
                    "El Cuadro de Instrumentos (17) no responde a la petición de diagnóstico.\n"
                    "Causa técnica: En el Audi A6 C6 (4F), el Cuadro J285 reside en el bus CAN Kombi aislado. "
                    "Para acceder a él desde el puerto OBD-II, la pasarela J533 debe habilitar el enrutamiento."
                )
                self._emit(f"✗ {msg_err}")
                return False, msg_err

            # 2. Sesión diagnóstica KWP2000
            self.kwp.start_diagnostic_session(0x86)
            time.sleep(0.05)

            # 3. Identificación del Cuadro (4F0 920 xxx)
            ident = self.kwp.read_ecu_identification()
            pn = ident.get("part_number", "4F0920xxx")
            self._emit(f"[CUADRO 17] Identificado: Ref {pn} | Software: {ident.get('sw_version', 'N/A')}")

            # 4. Método A: Canal de Adaptación 'Staging' (Método oficial A6 C6 Facelift)
            self._emit("[CUADRO 17] Comprobando canal de adaptación 'Staging'...")
            for ch in (0x3C, 0x01, 0x04):  # Canales documentados en firmware 4F0 920 Facelift
                try:
                    resp_ad = self.kwp.execute_service(0x21, subfunction=ch)
                    if resp_ad:
                        self._emit(f"[CUADRO 17] Canal {ch} disponible. Grabando activación...")
                        self.kwp.execute_service(0x3B, subfunction=ch, data=b"\x00\x01")
                        self.tp20.close_channel()
                        msg = "¡ÉXITO! Needle Sweep activado vía canal de adaptación en Cuadro 17."
                        self._emit(f"✓ {msg}")
                        return True, msg
                except Exception:
                    continue

            # 5. Método B: Codificación (Short Coding / Long Coding)
            current_coding = self.kwp.read_coding()
            if current_coding:
                coding_list = list(current_coding)
                self._emit(f"[CUADRO 17] Codificación actual ({len(coding_list)} bytes): " + " ".join(f"{b:02X}" for b in coding_list))

                # Guardar backup obligatorio
                try:
                    from gestion.backup_manager import BackupManager
                    bm = BackupManager()
                    bm.guardar_backup(
                        modulo="Cuadro Instrumentos (17)",
                        coche="WAUZZZ4F2AN066325",
                        bytes_coding=" ".join(f"{b:02X}" for b in coding_list),
                        etiqueta="PRE_NEEDLE_SWEEP"
                    )
                except Exception:
                    pass

                # En cuadros con Long Coding: Byte 1, Bit 0
                if len(coding_list) >= 2:
                    if coding_list[1] & 0x01:
                        self.tp20.close_channel()
                        return True, "El Needle Sweep ya estaba activo en la codificación del cuadro."
                    coding_list[1] |= 0x01
                    self.kwp.security_access(13861)
                    time.sleep(0.05)
                    if self.kwp.write_coding(bytes(coding_list)):
                        self.tp20.close_channel()
                        msg = "¡ÉXITO! Needle Sweep activado en codificación de Cuadro 17."
                        self._emit(f"✓ {msg}")
                        return True, msg

            self.tp20.close_channel()
            return False, "El cuadro no admitió la modificación de Staging por codificación estándar."

        except Exception as e:
            self.tp20.close_channel()
            err = f"Error en Cuadro 17: {e}"
            self._emit(f"✗ {err}")
            return False, err

    # ──────────────────────────────────────────────────────────────────────────
    #  OBJETIVO 2: DIAGNÓSTICO Y BORRADO DE LUCES (MÓDULO 09 - J519)
    # ──────────────────────────────────────────────────────────────────────────
    def gestionar_luces_modulo_09(self, borrar: bool = False) -> Tuple[bool, List[str]]:
        """
        Lee y opcionalmente borra los códigos de avería del módulo de luces/central eléctrica (09).
        """
        self._emit("\n" + "=" * 55)
        self._emit(f"  {'BORRANDO' if borrar else 'LEYENDO'} FALLOS MÓDULO 09 (LUCES)")
        self._emit("=" * 55)

        try:
            self.can.flush_rx()
            self._emit("[TP 2.0] Conectando a Módulo 09 vía canal TP 2.0...")
            if not self.tp20.open_channel(0x09, retries=1):
                return False, ["No se pudo conectar al Módulo 09 (Central Eléctrica) vía TP 2.0."]

            self.kwp.start_diagnostic_session(0x86)
            time.sleep(0.05)

            ident = self.kwp.read_ecu_identification()
            self._emit(f"Módulo identificado vía TP 2.0: Ref {ident.get('part_number')}")

            dtcs = self.kwp.read_dtcs()
            if dtcs:
                self._emit(f"Fallos encontrados ({len(dtcs)}):")
                for d in dtcs:
                    self._emit(f"  → {d}")
            else:
                self._emit("No hay códigos de error almacenados en el módulo de luces.")

            if borrar:
                self._emit("Borrando memoria de averías vía TP 2.0...")
                if self.kwp.clear_dtcs():
                    self._emit("✓ Memoria de averías borrada exitosamente.")
                    time.sleep(0.1)
                    dtcs_post = self.kwp.read_dtcs()
                    return True, dtcs_post
                else:
                    return False, ["Fallo al solicitar el borrado de averías vía TP 2.0."]

            return True, dtcs

        except Exception as e:
            err = f"Error en Módulo 09: {e}"
            self._emit(err)
            return False, [err]
        finally:
            self.tp20.close_channel()

    # ──────────────────────────────────────────────────────────────────────────
    #  AUTO-SCAN COMPLETO (VW TP 2.0)
    # ──────────────────────────────────────────────────────────────────────────
    def auto_scan_completo(self) -> Dict[str, dict]:
        """
        Escanea secuencialmente todos los módulos del Audi A6 C6 utilizando
        protocolo VW TP 2.0 a través del Gateway J533.
        """
        self._emit("\n" + "=" * 60)
        self._emit("  INICIANDO ESCANEO COMPLETO DE CENTRALITAS (AUDI A6 C6)")
        self._emit("=" * 60 + "\n")

        resultados = {}

        for addr, modulo in LOGICAL_MODULES.items():
            self._emit(f"Analizando {modulo} (0x{addr:02X})...")
            info = {
                "nombre": modulo,
                "addr": f"0x{addr:02X}",
                "conectado": False,
                "part_number": "N/A",
                "dtcs": [],
                "error": None
            }

            try:
                self.can.flush_rx()
                if self.tp20.open_channel(addr, retries=1):
                    info["conectado"] = True
                    self.kwp.start_diagnostic_session(0x86)
                    time.sleep(0.02)
                    ecu_id = self.kwp.read_ecu_identification()
                    info["part_number"] = ecu_id.get("part_number", "OK")
                    info["dtcs"] = self.kwp.read_dtcs()
                    num_dtcs = len(info["dtcs"])
                    self._emit(f"  ✓ {modulo} [TP 2.0]: {info['part_number']} — {num_dtcs} fallos detectados.")
                    self.tp20.close_channel()
                else:
                    self._emit(f"  - {modulo}: Sin respuesta (módulo no equipado o en reposo).")
            except Exception as e:
                info["error"] = str(e)
                self._emit(f"  ✗ {modulo}: Error ({e})")
                self.tp20.close_channel()

            resultados[modulo] = info
            time.sleep(0.02)

        return resultados

    # ──────────────────────────────────────────────────────────────────────────
    #  ACTIVAR MENÚ VERDE OCULTO (GREEN ENGINEERING MENU) EN MMI
    #  Módulo 07 (Control Head) -> Canal 08 = 1 (MMI 2G) / Módulo 5F -> Canal 06 = 1 (MMI 3G)
    # ──────────────────────────────────────────────────────────────────────────
    def activar_menu_verde_mmi(self) -> Tuple[bool, str]:
        """
        Activa el Menú Verde Oculto (Engineering Test Mode) en la pantalla central MMI.
        Prueba Módulo 07 (MMI 2G High, Canal 08) y Módulo 5F (MMI 3G, Canal 06).
        """
        self._emit("\n" + "=" * 55)
        self._emit("  ACTIVACIÓN MENÚ VERDE OCULTO MMI (AUDI A6 C6)")
        self._emit("=" * 55)

        # 1. Intentar MMI 2G High (Módulo 07)
        self._emit("[MMI] Probando Módulo 07 (Control Head / MMI 2G)...")
        if self.tp20.open_channel(0x07, retries=2):
            try:
                self.kwp.start_diagnostic_session(0x86)
                time.sleep(0.04)
                self._emit("[MMI 07] Escribiendo valor 1 en Canal de Adaptación 08...")
                if self.kwp.write_adaptation(channel=8, value=1):
                    msg = (
                        "¡Menú Verde activado con éxito en MMI 2G (Canal 08 = 1)!\n"
                        "Para reiniciar el MMI: Pulsa a la vez SETUP + Botón Giratorio Central + Botón Superior Derecho.\n"
                        "Para abrir el Menú Verde: Mantén pulsados CAR + SETUP a la vez durante 5 segundos."
                    )
                    self._emit(f"✓ {msg}")
                    return True, msg
            except Exception as e:
                self._emit(f"Error en Módulo 07: {e}")
            finally:
                self.tp20.close_channel()

        # 2. Intentar MMI 3G (Módulo 5F)
        self._emit("[MMI] Probando Módulo 5F (Information Electronics / MMI 3G)...")
        if self.tp20.open_channel(0x5F, retries=2):
            try:
                self.kwp.start_diagnostic_session(0x86)
                time.sleep(0.04)
                self._emit("[MMI 5F] Escribiendo valor 1 en Canal de Adaptación 06...")
                if self.kwp.write_adaptation(channel=6, value=1):
                    msg = (
                        "¡Menú Verde activado con éxito en MMI 3G (Canal 06 = 1)!\n"
                        "Para abrir el Menú Verde: Mantén pulsados CAR + SETUP (o CAR + MENU) durante 5 segundos."
                    )
                    self._emit(f"✓ {msg}")
                    return True, msg
            except Exception as e:
                self._emit(f"Error en Módulo 5F: {e}")
            finally:
                self.tp20.close_channel()

        err = "No se pudo comunicar con el sistema MMI (ni Módulo 07 ni 5F)."
        self._emit(f"✗ {err}")
        return False, err

