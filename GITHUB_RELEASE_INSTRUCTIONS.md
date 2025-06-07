# 🚀 Instrucciones para GitHub Release

## 📋 Archivos preparados para subir:

- **demo_office_gs.ksplat** (22.98 MB) - Auria Office
- **garden_high.ksplat** (172.21 MB) - Garden Scene
- **truck_high.ksplat** (71.35 MB) - Truck Scene  
- **stump_high.ksplat** (172.34 MB) - Stump Scene
- **bonsai_trimmed.ksplat** (4.05 MB) - Bonsai Scene

**Total: 442.93 MB**

## 🎯 Paso 1: Crear GitHub Release

### Opción A: Interfaz Web (Recomendado)
1. Ve a: https://github.com/villcadiego-dev/auria-visual-gs
2. Click en **"Releases"** → **"Create a new release"**
3. **Tag version**: `v1.0`
4. **Release title**: `Assets v1.0 - 3D Scene Files`
5. **Description**:
```
Archivos 3D para las escenas de Auria Visual GS:

- demo_office_gs.ksplat (22.98 MB) - auria scene
- garden_high.ksplat (172.21 MB) - dropin scene  
- truck_high.ksplat (71.35 MB) - truck scene
- stump_high.ksplat (172.34 MB) - stump scene
- bonsai_trimmed.ksplat (4.05 MB) - bonsai scene

Total: 442.93 MB

Estos archivos son necesarios para el correcto funcionamiento de las escenas 3D.
```

6. **Arrastra los 5 archivos** de la carpeta `release-files/` a la sección "Attach binaries"
7. Click **"Publish release"**

### Opción B: GitHub CLI (Más rápido)
```bash
gh release create v1.0 \
    --title "Assets v1.0 - 3D Scene Files" \
    --notes "Archivos 3D para las escenas de Auria Visual GS" \
    release-files/demo_office_gs.ksplat \
    release-files/garden_high.ksplat \
    release-files/truck_high.ksplat \
    release-files/stump_high.ksplat \
    release-files/bonsai_trimmed.ksplat
```

## ✅ Paso 2: Verificar URLs

Una vez creado el release, estas URLs deberían funcionar:

- https://github.com/villcadiego-dev/auria-visual-gs/releases/download/v1.0/demo_office_gs.ksplat
- https://github.com/villcadiego-dev/auria-visual-gs/releases/download/v1.0/garden_high.ksplat
- https://github.com/villcadiego-dev/auria-visual-gs/releases/download/v1.0/truck_high.ksplat
- https://github.com/villcadiego-dev/auria-visual-gs/releases/download/v1.0/stump_high.ksplat
- https://github.com/villcadiego-dev/auria-visual-gs/releases/download/v1.0/bonsai_trimmed.ksplat

## 🚀 Paso 3: Deploy a Netlify

Una vez que el release esté listo:

1. **Commit y push** los cambios de scene-configs.js
2. **Conectar repo** a Netlify
3. **Deploy automático** 

## 📝 Notas importantes:

- ✅ **scene-configs.js** ya está actualizado con las URLs correctas
- ✅ **netlify.toml** configurado con headers CORS
- ✅ **person.fbx** eliminado para reducir peso
- ✅ **.gitignore** actualizado para excluir archivos grandes

El proyecto estará listo para producción una vez completado el GitHub Release.