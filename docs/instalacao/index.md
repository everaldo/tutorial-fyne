# Instalação e Configuração

Esta seção aborda como instalar e configurar o Fyne.io em seu ambiente de desenvolvimento.

## Pré-requisitos

### Go Language

O Fyne requer Go versão 1.17 ou superior.

```bash
# Verificar versão do Go
go version
```

Se você não tem Go instalado, baixe em [golang.org](https://golang.org/dl/).

### Dependências do Sistema

#### Linux (Ubuntu/Debian)
```bash
sudo apt-get install gcc libc6-dev libgl1-mesa-dev libxcursor-dev libxi-dev libxinerama-dev libxrandr-dev libxxf86vm-dev libasound2-dev pkg-config
```

#### Linux (CentOS/RHEL/Fedora)
```bash
sudo yum install gcc glibc-devel mesa-libGL-devel libXcursor-devel libXi-devel libXinerama-devel libXrandr-devel libXxf86vm-devel alsa-lib-devel pkg-config
```

#### macOS
```bash
# Instalar Xcode command line tools
xcode-select --install
```

#### Windows
No Windows, você precisa de um compilador C como:
- **TDM-GCC** (recomendado)
- **MinGW-w64**
- **Microsoft C++ Build Tools**

## Instalação do Fyne

### Método 1: Novo Projeto

```bash
# Criar diretório do projeto
mkdir meu-app-fyne
cd meu-app-fyne

# Inicializar módulo Go
go mod init meu-app-fyne

# Instalar dependências principais
go get fyne.io/fyne/v2/app
go get fyne.io/fyne/v2/widget
go get fyne.io/fyne/v2/container
```

### Método 2: Projeto Existente

Se você já tem um projeto Go:

```bash
go get fyne.io/fyne/v2/app
go get fyne.io/fyne/v2/widget
go get fyne.io/fyne/v2/container
```

### Ferramenta Fyne CLI (Opcional)

A ferramenta `fyne` facilita o empacotamento e distribuição:

```bash
go install fyne.io/fyne/v2/cmd/fyne@latest
```

Verifique a instalação:
```bash
fyne version
```

## Primeiro Programa

Vamos criar nossa primeira aplicação Fyne:

```go title="main.go"
package main

import (
    "fyne.io/fyne/v2/app"
    "fyne.io/fyne/v2/widget"
)

func main() {
    // Criar aplicação
    myApp := app.New()
    
    // Criar janela
    myWindow := myApp.NewWindow("Meu Primeiro App Fyne")
    myWindow.Resize(fyne.NewSize(400, 300))

    // Criar conteúdo
    hello := widget.NewLabel("Olá, Mundo com Fyne!")
    
    // Definir conteúdo na janela
    myWindow.SetContent(hello)

    // Exibir e executar
    myWindow.ShowAndRun()
}
```

Execute o programa:
```bash
go run main.go
```

Se tudo estiver correto, você verá uma janela com a mensagem "Olá, Mundo com Fyne!"

## Estrutura Básica de Projeto

Recomendamos organizar seus projetos Fyne desta forma:

```
meu-app-fyne/
├── main.go              # Ponto de entrada
├── go.mod               # Dependências Go
├── go.sum               # Checksums das dependências
├── assets/              # Recursos (ícones, imagens)
│   ├── icon.png
│   └── logo.svg
├── internal/            # Código interno
│   ├── ui/             # Componentes de interface  
│   ├── models/         # Modelos de dados
│   └── services/       # Lógica de negócio
└── README.md           # Documentação
```

## Configuração do IDE

### VS Code

Instale as extensões:
- **Go** (oficial do Google)
- **Go Outliner**

Configuração no `settings.json`:
```json
{
    "go.useLanguageServer": true,
    "go.lintOnSave": "package",
    "go.formatTool": "goimports"
}
```

### GoLand/IntelliJ IDEA

O GoLand tem suporte nativo ao Go. Configure:
1. **File** → **Settings** → **Go** → **GOPATH**
2. Ative **Go Modules** se não estiver ativo
3. Configure o **GOPROXY** se necessário

### Vim/Neovim

Use plugins como:
- **vim-go**
- **coc-go** (para Neovim com CoC)

## Verificação da Instalação

Crie um programa de teste mais completo:

```go title="test-install.go"
package main

import (
    "fmt"
    "fyne.io/fyne/v2/app"
    "fyne.io/fyne/v2/container"
    "fyne.io/fyne/v2/widget"
)

func main() {
    myApp := app.New()
    myWindow := myApp.NewWindow("Teste de Instalação")
    myWindow.Resize(fyne.NewSize(600, 400))

    // Informações do sistema
    info := widget.NewLabel(fmt.Sprintf(
        "Fyne funcionando!\nVersão Go: %s\nSistema: %s",
        "1.21+", // Substitua pela versão real
        "Detectado automaticamente",
    ))

    // Botão de teste
    button := widget.NewButton("Testar Interação", func() {
        info.SetText("Botão clicado! ✅\nFyne está funcionando perfeitamente!")
    })

    // Layout
    content := container.NewVBox(
        widget.NewCard("Status da Instalação", "", info),
        button,
    )

    myWindow.SetContent(content)
    myWindow.ShowAndRun()
}
```

Execute:
```bash
go run test-install.go
```

## Problemas Comuns

### Erro: "CGO_ENABLED=0"

```bash
# Solução: Habilitar CGO
export CGO_ENABLED=1
go run main.go
```

### Erro: "package fyne.io/fyne/v2/app is not in GOPATH"

```bash
# Certificar que está usando Go Modules
go mod tidy
go run main.go
```

### Erro de Dependências C no Linux

```bash
# Instalar dependências de desenvolvimento
sudo apt-get install build-essential
```

### Performance no Windows

Para melhor performance no Windows, compile com:
```bash
go build -ldflags="-H windowsgui" .
```

## Próximos Passos

Agora que você tem o Fyne configurado, continue para os [Conceitos Básicos](../conceitos-basicos/index.md) onde aprenderá sobre a arquitetura e estrutura básica das aplicações Fyne.

---

**💡 Dica**: Mantenha suas dependências sempre atualizadas com `go get -u fyne.io/fyne/v2/app` para ter acesso às últimas funcionalidades e correções de bugs.