# Conceitos Básicos

Nesta seção, você aprenderá os conceitos fundamentais do Fyne.io e como estruturar suas aplicações.

## Arquitetura do Fyne

O Fyne segue uma arquitetura hierárquica simples e intuitiva:

```
App (Aplicação)
├── Window (Janela)
│   └── Content (Conteúdo)
│       ├── Container (Contêiner)
│       │   ├── Widget (Componente)
│       │   ├── Widget (Componente)
│       │   └── ...
│       └── Widget (Componente)
└── Window (Outra Janela)
    └── ...
```

### Hierarquia de Objetos

1. **App**: A aplicação principal
2. **Window**: Janelas da aplicação
3. **Container**: Contêineres para organizar widgets
4. **Widget**: Componentes da interface (botões, labels, etc.)

## Estrutura Básica de uma Aplicação

```go
package main

import (
    "fyne.io/fyne/v2/app"
    "fyne.io/fyne/v2/container"
    "fyne.io/fyne/v2/widget"
)

func main() {
    // 1. Criar aplicação
    myApp := app.New()
    
    // 2. Criar janela
    myWindow := myApp.NewWindow("Título da Janela")
    myWindow.Resize(fyne.NewSize(800, 600))
    
    // 3. Criar conteúdo
    content := container.NewVBox(
        widget.NewLabel("Bem-vindo ao Fyne!"),
        widget.NewButton("Clique aqui", func() {
            // Ação do botão
        }),
    )
    
    // 4. Definir conteúdo na janela
    myWindow.SetContent(content)
    
    // 5. Exibir e executar
    myWindow.ShowAndRun()
}
```

## Principais Interfaces

### fyne.App

A interface principal que representa sua aplicação:

```go
type App interface {
    NewWindow(title string) Window
    Run()
    Quit()
    Driver() Driver
    UniqueID() string
    Metadata() AppMetadata
    Settings() Settings
    Preferences() Preferences
    Storage() Storage
}
```

**Exemplo prático:**
```go
// Criar app com ID único (importante para configurações)
myApp := app.NewWithID("com.exemplo.meuapp")

// Definir metadados
myApp.SetMetadata(&fyne.AppMetadata{
    ID:      "com.exemplo.meuapp",
    Name:    "Meu App",
    Version: "1.0.0",
})
```

### fyne.Window

Representa uma janela da aplicação:

```go
type Window interface {
    Title() string
    SetTitle(title string)
    FullScreen() bool
    SetFullScreen(full bool)
    CenterOnScreen()
    Resize(size fyne.Size)
    RequestResize(size fyne.Size)
    FixedSize() bool
    SetFixedSize(fixed bool)
    Padded() bool
    SetPadded(padded bool)
    Icon() fyne.Resource
    SetIcon(icon fyne.Resource)
    SetMaster()
    
    Show()
    Hide()
    Close()
    ShowAndRun()
    
    Content() fyne.CanvasObject
    SetContent(content fyne.CanvasObject)
    Canvas() fyne.Canvas
    
    SetOnClosed(func())
    SetCloseIntercept(func())
}
```

**Exemplo prático:**
```go
window := myApp.NewWindow("Minha Janela")
window.Resize(fyne.NewSize(800, 600))
window.CenterOnScreen()
window.SetFixedSize(true)

// Interceptar fechamento
window.SetCloseIntercept(func() {
    // Confirmar antes de fechar
    dialog.ShowConfirm("Sair", "Deseja realmente sair?", 
        func(confirmed bool) {
            if confirmed {
                window.Close()
            }
        }, window)
})
```

### fyne.CanvasObject

Interface base para todos os objetos que podem ser desenhados:

```go
type CanvasObject interface {
    Size() Size
    Resize(Size)
    Position() Position
    Move(Position)
    MinSize() Size
    Visible() bool
    Show()
    Hide()
    Refresh()
}
```

## Ciclo de Vida da Aplicação

### 1. Inicialização
```go
// Criar aplicação
app := app.New()

// Configurar aplicação
app.Settings().SetTheme(theme.DarkTheme())
```

### 2. Criação de Interface
```go
// Criar janela
window := app.NewWindow("Minha App")

// Criar widgets
label := widget.NewLabel("Olá!")
button := widget.NewButton("Clique", func() {
    label.SetText("Clicado!")
})

// Organizar em container
content := container.NewVBox(label, button)
window.SetContent(content)
```

### 3. Execução
```go
// Exibir e executar (bloqueia até a janela fechar)
window.ShowAndRun()

// OU

// Exibir sem bloquear
window.Show()
app.Run() // Bloqueia até app.Quit() ser chamado
```

### 4. Limpeza
```go
// Executar limpeza antes de sair
window.SetOnClosed(func() {
    // Salvar configurações
    // Fechar conexões
    // Limpar recursos
})
```

## Gerenciamento de Estado

### Estado Local
```go
type AppState struct {
    counter int
    text    string
    items   []string
}

func main() {
    state := &AppState{counter: 0}
    
    app := app.New()
    window := app.NewWindow("Estado Local")
    
    // Label que mostra o contador
    counterLabel := widget.NewLabel(fmt.Sprintf("Contador: %d", state.counter))
    
    // Botão que incrementa
    incrementBtn := widget.NewButton("Incrementar", func() {
        state.counter++
        counterLabel.SetText(fmt.Sprintf("Contador: %d", state.counter))
    })
    
    content := container.NewVBox(counterLabel, incrementBtn)
    window.SetContent(content)
    window.ShowAndRun()
}
```

### Estado Global com Singleton
```go
type GlobalState struct {
    mu      sync.RWMutex
    data    map[string]interface{}
    observers []func(key string, value interface{})
}

var globalState = &GlobalState{
    data: make(map[string]interface{}),
}

func (gs *GlobalState) Set(key string, value interface{}) {
    gs.mu.Lock()
    defer gs.mu.Unlock()
    
    gs.data[key] = value
    
    // Notificar observadores
    for _, observer := range gs.observers {
        observer(key, value)
    }
}

func (gs *GlobalState) Get(key string) interface{} {
    gs.mu.RLock()
    defer gs.mu.RUnlock()
    return gs.data[key]
}

func (gs *GlobalState) AddObserver(observer func(string, interface{})) {
    gs.mu.Lock()
    defer gs.mu.Unlock()
    gs.observers = append(gs.observers, observer)
}
```

## Tratamento de Eventos

### Eventos de Janela
```go
window.SetOnClosed(func() {
    fmt.Println("Janela fechada")
})

// Usar content.OnTypedKey para eventos de teclado globais
```

### Eventos de Widgets
```go
// Botão
button := widget.NewButton("Clique", func() {
    fmt.Println("Botão clicado!")
})

// Entry
entry := widget.NewEntry()
entry.OnChanged = func(text string) {
    fmt.Printf("Texto alterado: %s\n", text)
}
entry.OnSubmitted = func(text string) {
    fmt.Printf("Texto submetido: %s\n", text)
}

// Check
check := widget.NewCheck("Opção", func(checked bool) {
    fmt.Printf("Check alterado: %t\n", checked)
})
```

## Padrões de Arquitetura

### MVC (Model-View-Controller)
```go
// Model
type User struct {
    Name  string
    Email string
    Age   int
}

// View
type UserView struct {
    nameEntry  *widget.Entry
    emailEntry *widget.Entry
    ageEntry   *widget.Entry
    container  *fyne.Container
}

func NewUserView() *UserView {
    uv := &UserView{
        nameEntry:  widget.NewEntry(),
        emailEntry: widget.NewEntry(),
        ageEntry:   widget.NewEntry(),
    }
    
    uv.container = container.NewVBox(
        widget.NewLabel("Nome:"),
        uv.nameEntry,
        widget.NewLabel("Email:"),
        uv.emailEntry,
        widget.NewLabel("Idade:"),
        uv.ageEntry,
    )
    
    return uv
}

// Controller
type UserController struct {
    model *User
    view  *UserView
}

func NewUserController() *UserController {
    return &UserController{
        model: &User{},
        view:  NewUserView(),
    }
}

func (uc *UserController) UpdateModel() {
    uc.model.Name = uc.view.nameEntry.Text
    uc.model.Email = uc.view.emailEntry.Text
    // Converter idade...
}

func (uc *UserController) UpdateView() {
    uc.view.nameEntry.SetText(uc.model.Name)
    uc.view.emailEntry.SetText(uc.model.Email)
    uc.view.ageEntry.SetText(fmt.Sprintf("%d", uc.model.Age))
}
```

## Debugging e Profiling

### Logs
```go
import "fyne.io/fyne/v2/app"

// Ativar logs de debug
fyne.SetLogLevel(fyne.LogLevelDebug)

// Usar logs customizados
import "log"

log.Println("Debug: Aplicação iniciada")
```

### Inspetor de Objetos
```go
// No modo de desenvolvimento, você pode usar:
if fyne.CurrentApp().Settings().BuildType() == fyne.BuildDebug {
    // Ativar inspetor
    window.SetContent(container.NewBorder(
        nil, nil, nil, 
        widget.NewButton("Inspect", func() {
            // Código para inspeção
        }),
        content,
    ))
}
```

## Boas Práticas

### 1. Estrutura de Código
- Separe a lógica de negócio da interface
- Use interfaces para desacoplar componentes
- Organize código em pacotes lógicos

### 2. Gerenciamento de Recursos
- Sempre feche recursos (arquivos, conexões)
- Use context.Context para operações longas
- Implemente limpeza no OnClosed

### 3. Performance
- Evite operações pesadas na goroutine principal
- Use binding para atualizações automáticas
- Reutilize widgets quando possível

### 4. Responsividade
- Use layouts flexíveis
- Teste em diferentes resoluções
- Implemente redimensionamento adequado

## Próximos Passos

Agora que você entende os conceitos básicos, continue para [Componentes da Interface](../componentes/index.md) onde aprenderá sobre todos os widgets disponíveis no Fyne.

---

**💡 Dica**: Pratique criando pequenas aplicações com diferentes combinações de widgets e containers para solidificar esses conceitos!