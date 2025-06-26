# Compilação Cross-Platform

Esta seção aborda como compilar aplicações Fyne para diferentes plataformas usando tanto métodos manuais quanto ferramentas automatizadas.

## Visão Geral

O Fyne é projetado para criar aplicações verdadeiramente multiplataforma com um único código-base. Você pode compilar para:

### Plataformas Suportadas
- **Desktop**: Windows, macOS, Linux, FreeBSD
- **Mobile**: Android, iOS
- **Web**: Aplicações browser

### Vantagens da Compilação Cross-Platform
- Um código, múltiplas plataformas
- Interface nativa em cada sistema
- Distribuição simplificada
- Manutenção centralizada

## Pré-requisitos

### Ferramentas Básicas
```bash
# Go 1.17 ou superior
go version

# Verificar se CGO está habilitado
go env CGO_ENABLED # Deve retornar "1"
```

### Dependências por Plataforma

#### Linux (Ubuntu/Debian)
```bash
sudo apt-get install gcc libc6-dev libgl1-mesa-dev libxcursor-dev \
    libxi-dev libxinerama-dev libxrandr-dev libxxf86vm-dev \
    libasound2-dev pkg-config
```

#### Linux (CentOS/RHEL/Fedora)
```bash
sudo yum install gcc glibc-devel mesa-libGL-devel libXcursor-devel \
    libXi-devel libXinerama-devel libXrandr-devel libXxf86vm-devel \
    alsa-lib-devel pkg-config
```

#### macOS
```bash
# Instalar ferramentas de linha de comando do Xcode
xcode-select --install
```

#### Windows
- **TDM-GCC** (recomendado)
- **MinGW-w64**
- **Microsoft C++ Build Tools**

## Método 1: Compilação Manual

### Compilação Nativa (Plataforma Atual)
```bash
# Compilação básica
go build -o meuapp main.go

# Compilação otimizada para produção
go build -ldflags="-w -s" -o meuapp main.go

# Windows: remover console
go build -ldflags="-H windowsgui -w -s" -o meuapp.exe main.go
```

### Cross-Compilation Manual

#### Para Windows (a partir de Linux/macOS)
```bash
# Instalar compilador cruzado
sudo apt-get install gcc-mingw-w64

# Configurar variáveis
export GOOS=windows
export GOARCH=amd64
export CGO_ENABLED=1
export CC=x86_64-w64-mingw32-gcc

# Compilar
go build -ldflags="-H windowsgui -w -s" -o meuapp.exe main.go
```

#### Para macOS (a partir de Linux)
```bash
# Instalar osxcross (processo complexo)
# Alternativa: usar fyne-cross (recomendado)

export GOOS=darwin
export GOARCH=amd64
export CGO_ENABLED=1
export CC=o64-clang

go build -o meuapp main.go
```

#### Para Linux (a partir de Windows/macOS)
```bash
export GOOS=linux
export GOARCH=amd64
export CGO_ENABLED=1
export CC=x86_64-linux-gnu-gcc

go build -o meuapp main.go
```

## Método 2: Usando fyne-cross (Recomendado)

### Instalação do fyne-cross
```bash
# Instalar fyne-cross
go install github.com/fyne-io/fyne-cross@latest

# Verificar instalação
fyne-cross version
```

### Compilação com fyne-cross

#### Compilar para Todas as Plataformas Desktop
```bash
# Diretório do projeto
cd meu-projeto-fyne

# Compilar para todas as plataformas
fyne-cross windows
fyne-cross darwin
fyne-cross linux
fyne-cross freebsd
```

#### Compilação com Opções Avançadas
```bash
# Especificar arquitetura
fyne-cross windows -arch=amd64,386

# Compilar com flags customizadas
fyne-cross linux -ldflags="-w -s"

# Especificar versão do Go
fyne-cross darwin -go-version=1.21

# Compilar para múltiplas arquiteturas
fyne-cross linux -arch=*  # Todas as arquiteturas suportadas
```

### Estrutura de Saída
```
meu-projeto/
├── fyne-cross/
│   ├── bin/
│   │   ├── windows-amd64/
│   │   │   └── meuapp.exe
│   │   ├── darwin-amd64/
│   │   │   └── meuapp
│   │   ├── linux-amd64/
│   │   │   └── meuapp
│   │   └── freebsd-amd64/
│   │       └── meuapp
│   └── tmp/
└── main.go
```

## Método 3: Usando fyne CLI

### Instalação da Ferramenta fyne
```bash
# Instalar ferramenta fyne
go install fyne.io/fyne/v2/cmd/fyne@latest

# Verificar instalação
fyne version
```

### Empacotamento com fyne

#### Empacotar para Plataforma Atual
```bash
# Pacote básico
fyne package -o meuapp

# Pacote com ícone
fyne package -o meuapp -icon icon.png

# Pacote com metadados
fyne package -o meuapp -icon icon.png -name "Meu App" -id "com.exemplo.meuapp"
```

#### Empacotar para Plataformas Específicas
```bash
# Windows
fyne package -os windows -icon icon.png

# macOS (cria .app bundle)
fyne package -os darwin -icon icon.png

# Linux (cria .tar.xz)
fyne package -os linux -icon icon.png
```

### Instalação no Sistema
```bash
# Instalar no sistema local
fyne install -icon icon.png
```

## Exemplo Completo: Script de Build

### Script Bash para Build Automatizado
```bash
#!/bin/bash
# build.sh - Script de compilação cross-platform

APP_NAME="meuapp"
VERSION="1.0.0"
LDFLAGS="-w -s -X main.version=$VERSION"

echo "🚀 Iniciando build cross-platform para $APP_NAME v$VERSION"

# Limpar builds anteriores
rm -rf dist/
mkdir -p dist/

# Build para Windows
echo "🏗️  Compilando para Windows..."
fyne-cross windows -ldflags="$LDFLAGS -H windowsgui" -output="$APP_NAME.exe"
if [ $? -eq 0 ]; then
    cp fyne-cross/bin/windows-amd64/$APP_NAME.exe dist/
    echo "✅ Windows build concluído"
else
    echo "❌ Erro no build Windows"
fi

# Build para macOS
echo "🏗️  Compilando para macOS..."
fyne-cross darwin -ldflags="$LDFLAGS" -output="$APP_NAME"
if [ $? -eq 0 ]; then
    cp fyne-cross/bin/darwin-amd64/$APP_NAME dist/$APP_NAME-macos
    echo "✅ macOS build concluído"
else
    echo "❌ Erro no build macOS"
fi

# Build para Linux
echo "🏗️  Compilando para Linux..."
fyne-cross linux -ldflags="$LDFLAGS" -output="$APP_NAME"
if [ $? -eq 0 ]; then
    cp fyne-cross/bin/linux-amd64/$APP_NAME dist/$APP_NAME-linux
    echo "✅ Linux build concluído"
else
    echo "❌ Erro no build Linux"
fi

# Criar checksums
echo "📝 Gerando checksums..."
cd dist/
for file in *; do
    if [ -f "$file" ]; then
        sha256sum "$file" > "$file.sha256"
    fi
done
cd ..

echo "🎉 Build concluído! Arquivos em dist/"
ls -la dist/
```

### Script PowerShell para Windows
```powershell
# build.ps1 - Script de compilação cross-platform

$APP_NAME = "meuapp"
$VERSION = "1.0.0"
$LDFLAGS = "-w -s -X main.version=$VERSION"

Write-Host "🚀 Iniciando build cross-platform para $APP_NAME v$VERSION" -ForegroundColor Green

# Limpar builds anteriores
if (Test-Path "dist\") {
    Remove-Item -Recurse -Force "dist\"
}
New-Item -ItemType Directory -Path "dist" | Out-Null

# Função para executar build
function Build-Platform {
    param($Platform, $Extension = "", $ExtraFlags = "")
    
    Write-Host "🏗️  Compilando para $Platform..." -ForegroundColor Yellow
    
    $OutputName = "$APP_NAME$Extension"
    $FinalFlags = "$LDFLAGS $ExtraFlags"
    
    & fyne-cross $Platform -ldflags="$FinalFlags" -output="$OutputName"
    
    if ($LASTEXITCODE -eq 0) {
        $SourcePath = "fyne-cross\bin\$Platform-amd64\$OutputName"
        $DestPath = "dist\$APP_NAME-$Platform$Extension"
        Copy-Item $SourcePath $DestPath
        Write-Host "✅ $Platform build concluído" -ForegroundColor Green
    } else {
        Write-Host "❌ Erro no build $Platform" -ForegroundColor Red
    }
}

# Builds
Build-Platform "windows" ".exe" "-H windowsgui"
Build-Platform "darwin" "-macos"
Build-Platform "linux" "-linux"

# Gerar checksums
Write-Host "📝 Gerando checksums..." -ForegroundColor Yellow
Get-ChildItem "dist\*" -File | ForEach-Object {
    $hash = Get-FileHash $_.FullName -Algorithm SHA256
    "$($hash.Hash.ToLower())  $($_.Name)" | Out-File -Encoding ascii "$($_.FullName).sha256"
}

Write-Host "🎉 Build concluído! Arquivos em dist/" -ForegroundColor Green
Get-ChildItem "dist\" | Format-Table Name, Length, LastWriteTime
```

## Compilação para Mobile

### Android
```bash
# Instalar fyne-cross com suporte Android
fyne-cross android -arch=arm64

# Gerar APK
fyne package -os android -icon icon.png
```

### iOS
```bash
# Requer macOS e Xcode
fyne-cross ios

# Gerar arquivo .app
fyne package -os ios -icon icon.png
```

## Exemplo: Aplicação com Build Condicional

```go
package main

import (
    "fmt"
    "runtime"
    
    "fyne.io/fyne/v2/app"
    "fyne.io/fyne/v2/container"
    "fyne.io/fyne/v2/widget"
)

var (
    version   = "dev"     // Será definido via -ldflags
    buildTime = "unknown" // Será definido via -ldflags
    gitCommit = "unknown" // Será definido via -ldflags
)

func main() {
    myApp := app.NewWithID("com.exemplo.crossplatform")
    myWindow := myApp.NewWindow("App Cross-Platform")
    
    // Informações da plataforma
    platformInfo := fmt.Sprintf(`Informações da Plataforma:
    
• Sistema: %s
• Arquitetura: %s
• Versão Go: %s
• Versão App: %s
• Build: %s
• Commit: %s
    
Compilado para: %s/%s`,
        runtime.GOOS,
        runtime.GOARCH,
        runtime.Version(),
        version,
        buildTime,
        gitCommit,
        runtime.GOOS,
        runtime.GOARCH,
    )
    
    infoLabel := widget.NewLabel(platformInfo)
    
    // Funcionalidades específicas da plataforma
    var platformFeatures []string
    
    switch runtime.GOOS {
    case "windows":
        platformFeatures = []string{
            "Integração com Windows Shell",
            "Notificações do Windows",
            "Registro do Windows",
        }
    case "darwin":
        platformFeatures = []string{
            "Integração com macOS Dock",
            "Notificações do macOS",
            "Keychain Access",
        }
    case "linux":
        platformFeatures = []string{
            "Integração com D-Bus",
            "Notificações do Desktop",
            "Temas GTK",
        }
    default:
        platformFeatures = []string{"Recursos genéricos"}
    }
    
    featuresList := widget.NewList(
        func() int { return len(platformFeatures) },
        func() fyne.CanvasObject {
            return widget.NewLabel("Feature")
        },
        func(i widget.ListItemID, o fyne.CanvasObject) {
            o.(*widget.Label).SetText(platformFeatures[i])
        },
    )
    
    content := container.NewVBox(
        widget.NewCard("Sistema", "", infoLabel),
        widget.NewCard("Recursos da Plataforma", "", featuresList),
    )
    
    myWindow.SetContent(content)
    myWindow.Resize(fyne.NewSize(600, 500))
    myWindow.ShowAndRun()
}
```

### Build com Metadados
```bash
# Build com informações de versão
BUILD_TIME=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
GIT_COMMIT=$(git rev-parse --short HEAD)
VERSION="1.0.0"

go build -ldflags="-X main.version=$VERSION -X main.buildTime=$BUILD_TIME -X main.gitCommit=$GIT_COMMIT" main.go
```

## Distribuição e Empacotamento

### Criando Instaladores

#### Windows (usando NSIS)
```nsis
; installer.nsi
!define APP_NAME "Meu App"
!define APP_VERSION "1.0.0"

Name "${APP_NAME}"
OutFile "${APP_NAME}-${APP_VERSION}-setup.exe"
InstallDir "$PROGRAMFILES\${APP_NAME}"

Section "Main"
    SetOutPath $INSTDIR
    File "meuapp.exe"
    File "icon.ico"
    
    WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP_NAME}" "DisplayName" "${APP_NAME}"
    WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP_NAME}" "UninstallString" "$INSTDIR\uninstall.exe"
    
    CreateDirectory "$SMPROGRAMS\${APP_NAME}"
    CreateShortcut "$SMPROGRAMS\${APP_NAME}\${APP_NAME}.lnk" "$INSTDIR\meuapp.exe"
    CreateShortcut "$DESKTOP\${APP_NAME}.lnk" "$INSTDIR\meuapp.exe"
SectionEnd
```

#### macOS (usando create-dmg)
```bash
#!/bin/bash
# create-dmg.sh

APP_NAME="Meu App"
VERSION="1.0.0"

# Criar estrutura do .app
mkdir -p "dist/$APP_NAME.app/Contents/MacOS"
mkdir -p "dist/$APP_NAME.app/Contents/Resources"

# Copiar executável
cp "meuapp-macos" "dist/$APP_NAME.app/Contents/MacOS/$APP_NAME"
chmod +x "dist/$APP_NAME.app/Contents/MacOS/$APP_NAME"

# Info.plist
cat > "dist/$APP_NAME.app/Contents/Info.plist" << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleExecutable</key>
    <string>$APP_NAME</string>
    <key>CFBundleIdentifier</key>
    <string>com.exemplo.meuapp</string>
    <key>CFBundleName</key>
    <string>$APP_NAME</string>
    <key>CFBundleVersion</key>
    <string>$VERSION</string>
</dict>
</plist>
EOF

# Criar DMG
create-dmg \
    --volname "$APP_NAME" \
    --window-pos 200 120 \
    --window-size 600 300 \
    --icon-size 100 \
    --app-drop-link 450 150 \
    "dist/$APP_NAME-$VERSION.dmg" \
    "dist/$APP_NAME.app"
```

#### Linux (usando FPM)
```bash
#!/bin/bash
# create-deb.sh

APP_NAME="meuapp"
VERSION="1.0.0"

# Criar estrutura de diretórios
mkdir -p pkg/usr/bin
mkdir -p pkg/usr/share/applications
mkdir -p pkg/usr/share/pixmaps

# Copiar arquivos
cp meuapp-linux pkg/usr/bin/meuapp
cp icon.png pkg/usr/share/pixmaps/meuapp.png

# Criar .desktop file
cat > pkg/usr/share/applications/meuapp.desktop << EOF
[Desktop Entry]
Name=Meu App
Comment=Descrição do aplicativo
Exec=/usr/bin/meuapp
Icon=/usr/share/pixmaps/meuapp.png
Terminal=false
Type=Application
Categories=Office;
EOF

# Criar pacote DEB
fpm -s dir -t deb \
    -n "$APP_NAME" \
    -v "$VERSION" \
    --description "Descrição do aplicativo" \
    --url "https://exemplo.com" \
    --maintainer "Seu Nome <seu@email.com>" \
    -C pkg \
    usr
```

## Automatização com CI/CD

### GitHub Actions
```yaml
# .github/workflows/build.yml
name: Build Cross-Platform

on:
  push:
    tags:
      - 'v*'

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    
    - name: Set up Go
      uses: actions/setup-go@v3
      with:
        go-version: 1.21
    
    - name: Install fyne-cross
      run: go install github.com/fyne-io/fyne-cross@latest
    
    - name: Build Windows
      run: fyne-cross windows -arch=amd64
    
    - name: Build macOS
      run: fyne-cross darwin -arch=amd64
    
    - name: Build Linux
      run: fyne-cross linux -arch=amd64
    
    - name: Upload artifacts
      uses: actions/upload-artifact@v3
      with:
        name: cross-platform-builds
        path: fyne-cross/bin/
```

## Próximos Passos

Continue para [Requisições HTTP](../requisicoes-http/index.md) onde aprenderá como integrar APIs e serviços web em suas aplicações Fyne.

---

**💡 Dica**: Use o fyne-cross para builds automatizados e consistentes, especialmente em pipelines de CI/CD!