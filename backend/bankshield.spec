# -*- mode: python ; coding: utf-8 -*-
"""
PyInstaller spec for bundling the BankShield Flask backend into a standalone exe.

Usage (from the backend/ directory):
    pip install pyinstaller
    pyinstaller bankshield.spec

Output: backend/dist/app/app.exe  (referenced by electron-builder extraResources)
"""

block_cipher = None

a = Analysis(
    ['app.py'],
    pathex=['.'],
    binaries=[],
    datas=[],
    hiddenimports=[
        'flask',
        'flask_cors',
        'pymongo',
        'pymongo.uri_parser',
        'pymongo.monitor',
        'pymongo.errors',
        'pymongo.collection',
        'pymongo.database',
        'dns.resolver',
        'dns.rdatatype',
        'bson',
        'bson.codec_options',
        'bson.json_util',
        'bson.objectid',
        'gridfs',
    ],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=['tkinter', 'unittest', 'test'],
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=block_cipher,
    noarchive=False,
)

pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)

exe = EXE(
    pyz,
    a.scripts,
    [],
    exclude_binaries=True,
    name='app',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    console=True,   # Keep console=True so Flask logs are visible in Electron's stderr pipe
)

coll = COLLECT(
    exe,
    a.binaries,
    a.zipfiles,
    a.datas,
    strip=False,
    upx=True,
    upx_exclude=[],
    name='app',
)
