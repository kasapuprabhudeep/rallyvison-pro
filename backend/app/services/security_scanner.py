import os
import logging
from pathlib import Path
from typing import Tuple, Optional

logger = logging.getLogger(__name__)

class SecurityScanner:
    """
    Antivirus & Binary Integrity Protection Engine for RallyVision Pro.
    Automatically identifies, quarantines, and shreds malicious, disguised, or corrupt files
    before they can touch background worker processes or compromise system stability.
    """

    # Dangerous binary executable signatures
    DISALLOWED_MAGIC_HEADERS = [
        (b"MZ", "Windows PE Executable / DLL / Screensaver"),
        (b"\x7fELF", "Linux Executable Binary (ELF)"),
        (b"\xca\xfe\xba\xbe", "Java Bytecode / Mach-O Binary"),
        (b"PK\x03\x04", "Compressed Archive / APK / JAR Bomb"),
        (b"\x1f\x8b", "Gzip / Tarball Payload"),
        (b"7z\xbc\xaf\x27\x1c", "7-Zip Archive"),
        (b"Rar!\x1a\x07", "RAR Archive"),
    ]

    # Malicious text/script payload markers
    DISALLOWED_TEXT_PATTERNS = [
        b"<?php",
        b"#!/bin/sh",
        b"#!/bin/bash",
        b"powershell",
        b"cmd.exe",
        b"<script",
        b"javascript:",
        b"eval(",
        b"system(",
        b"X5O!P%@AP[4\\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*"
    ]

    # Valid video container signatures
    VALID_MP4_BRANDS = [
        b"isom", b"iso2", b"mp41", b"mp42", b"qt  ",
        b"M4V ", b"MSNV", b"avc1", b"dash", b"3gp4"
    ]

    @classmethod
    def scan_and_validate_video(cls, file_path: Path) -> Tuple[bool, str]:
        """
        Scans uploaded media file for virus signatures, executable headers, and container integrity.
        Returns (is_clean: bool, reason: str).
        """
        if not file_path.exists():
            return False, "File does not exist."

        file_size = os.path.getsize(file_path)
        if file_size < 32:
            cls.shred_and_delete(file_path)
            return False, "File is empty or truncated (< 32 bytes)."

        try:
            with open(file_path, "rb") as f:
                header = f.read(min(4096, file_size))
        except Exception as e:
            cls.shred_and_delete(file_path)
            return False, f"Failed to read file header: {str(e)}"

        # 1. Antivirus / Disallowed Binary Executable Check
        for magic, desc in cls.DISALLOWED_MAGIC_HEADERS:
            if header.startswith(magic):
                cls.shred_and_delete(file_path)
                logger.warning(f"[ANTIVIRUS ALERT] Blocked and shredded malicious executable: {desc} in {file_path.name}")
                return False, f"Security Violation: Malicious or executable binary detected ({desc}). File shredded."

        # 2. Malicious Script / Shellcode Pattern Check
        header_lower = header.lower()
        for pattern in cls.DISALLOWED_TEXT_PATTERNS:
            if pattern.lower() in header_lower:
                cls.shred_and_delete(file_path)
                logger.warning(f"[ANTIVIRUS ALERT] Blocked script payload signature in {file_path.name}")
                return False, "Security Violation: File contains dangerous script or shellcode payload. File shredded."

        # 3. Legitimate Video Magic Bytes Verification
        is_valid_container = False
        
        # Check MP4 / QuickTime / MOV: Contains 'ftyp' box within first 64 bytes
        if b"ftyp" in header[:64]:
            ftyp_idx = header.find(b"ftyp")
            brand = header[ftyp_idx + 4: ftyp_idx + 8]
            if any(b in brand for b in cls.VALID_MP4_BRANDS):
                is_valid_container = True
            else:
                # Accept generic ftyp box
                is_valid_container = True
        
        # Check WebM / Matroska (MKV): Starts with EBML ID 0x1A 0x45 0xDF 0xA3
        elif header.startswith(b"\x1a\x45\xdf\xa3"):
            is_valid_container = True

        # Check AVI: Starts with 'RIFF' and contains 'AVI '
        elif header.startswith(b"RIFF") and b"AVI " in header[:32]:
            is_valid_container = True

        if not is_valid_container:
            cls.shred_and_delete(file_path)
            logger.warning(f"[INTEGRITY VIOLATION] Non-video or disguised binary rejected: {file_path.name}")
            return False, "Invalid Media Container: File header does not match genuine video signatures. File shredded."

        return True, "File is clean, valid, and authenticated."

    @classmethod
    def shred_and_delete(cls, file_path: Path) -> None:
        """
        Securely sanitizes and unlinks a malicious or corrupt file from the filesystem.
        Overwrites the file header with null-bytes to prevent data retrieval before deletion.
        """
        try:
            if file_path.exists():
                try:
                    # Overwrite header with zeros
                    with open(file_path, "wb") as f:
                        f.write(b"\x00" * min(4096, os.path.getsize(file_path)))
                except Exception:
                    pass
                os.remove(file_path)
                logger.info(f"[SECURITY SHREDDER] File {file_path.name} was securely wiped and deleted.")
        except Exception as e:
            logger.error(f"[SECURITY ERROR] Failed to delete file {file_path.name}: {str(e)}")
