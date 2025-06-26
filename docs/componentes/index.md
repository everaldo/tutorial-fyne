# Componentes da Interface

Esta seção apresenta todos os widgets e containers disponíveis no Fyne para construir interfaces ricas e interativas.

## Widgets Básicos

### Label
Exibe texto estático.

```go
// Label simples
label := widget.NewLabel("Texto simples")

// Label com formatação
richLabel := widget.NewRichTextFromMarkdown(`
# Título
**Negrito** e *itálico*
- Item 1
- Item 2
`)

// Label com binding
data := binding.NewString()
data.Set("Texto dinâmico")
boundLabel := widget.NewLabelWithData(data)
```

### Button
Botão clicável com ação.

```go
// Botão básico
button := widget.NewButton("Clique aqui", func() {
    fmt.Println("Botão clicado!")
})

// Botão com ícone
iconButton := widget.NewButtonWithIcon("Salvar", theme.DocumentSaveIcon(), func() {
    // Ação de salvar
})

// Botão personalizado
button.Importance = widget.HighImportance // Destaque visual
button.Disable() // Desabilitar
button.Enable()  // Habilitar
```

### Entry
Campo de entrada de texto.

```go
// Entry básico
entry := widget.NewEntry()
entry.SetPlaceHolder("Digite algo...")

// Entry com validação
entry.Validator = validation.NewRegexp(`^\d+$`, "Apenas números")

// Entry de senha
password := widget.NewPasswordEntry()

// Entry multilinha
multiEntry := widget.NewMultiLineEntry()
multiEntry.SetText("Linha 1\nLinha 2\nLinha 3")

// Eventos
entry.OnChanged = func(text string) {
    fmt.Printf("Texto alterado: %s\n", text)
}
entry.OnSubmitted = func(text string) {
    fmt.Printf("Texto submetido: %s\n", text)
}
```

### Check
Caixa de seleção.

```go
check := widget.NewCheck("Aceito os termos", func(checked bool) {
    if checked {
        fmt.Println("Termos aceitos")
    } else {
        fmt.Println("Termos rejeitados")
    }
})

// Estado inicial
check.SetChecked(true)
```

### Radio
Grupo de opções mutuamente exclusivas.

```go
radio := widget.NewRadioGroup(
    []string{"Opção 1", "Opção 2", "Opção 3"}, 
    func(selected string) {
        fmt.Printf("Selecionado: %s\n", selected)
    },
)

// Definir seleção inicial
radio.SetSelected("Opção 2")

// Layout horizontal
radio.Horizontal = true
```

### Select
Lista dropdown de seleção.

```go
options := []string{"Item 1", "Item 2", "Item 3", "Item 4"}
selectWidget := widget.NewSelect(options, func(selected string) {
    fmt.Printf("Selecionado: %s\n", selected)
})

// Definir placeholder
selectWidget.SetPlaceHolder("Escolha uma opção...")

// Seleção inicial
selectWidget.SetSelected("Item 2")

// Alterar opções dinamicamente
selectWidget.Options = []string{"Nova 1", "Nova 2"}
selectWidget.Refresh()
```

### Slider
Controle deslizante para valores numéricos.

```go
slider := widget.NewSlider(0, 100)
slider.SetValue(50)

// Slider com step
slider.Step = 5

// Evento de mudança
slider.OnChanged = func(value float64) {
    fmt.Printf("Valor: %.2f\n", value)
}

// Label que acompanha o slider
valueLabel := widget.NewLabel("50")
slider.OnChanged = func(value float64) {
    valueLabel.SetText(fmt.Sprintf("%.0f", value))
}
```

### ProgressBar
Barra de progresso.

```go
// ProgressBar determinada
progress := widget.NewProgressBar()
progress.SetValue(0.7) // 70%

// ProgressBar indeterminada (loading)
infiniteProgress := widget.NewProgressBarInfinite()

// Simular progresso
go func() {
    for i := 0; i <= 100; i++ {
        progress.SetValue(float64(i) / 100)
        time.Sleep(50 * time.Millisecond)
    }
}()
```

## Widgets de Texto Rico

### RichText
Texto com formatação avançada.

```go
richText := widget.NewRichTextFromMarkdown(`
# Título Principal

## Subtítulo

**Texto em negrito** e *texto em itálico*.

### Lista:
- Item 1
- Item 2  
- Item 3

### Código:
` + "```go\nfmt.Println(\"Hello, World!\")\n```" + `

[Link para Fyne.io](https://fyne.io)
`)

// Scroll para texto longo
richScroll := container.NewScroll(richText)
richScroll.SetMinSize(fyne.NewSize(400, 300))
```

### Hyperlink
Links clicáveis.

```go
link := widget.NewHyperlink("Visite Fyne.io", parseURL("https://fyne.io"))

// Função helper para URL
func parseURL(urlStr string) *url.URL {
    link, err := url.Parse(urlStr)
    if err != nil {
        fyne.LogError("Could not parse URL", err)
    }
    return link
}
```

## Widgets de Lista e Árvore

### List
Lista scrollável de itens.

```go
data := []string{"Item 1", "Item 2", "Item 3", "Item 4", "Item 5"}

list := widget.NewList(
    func() int {
        return len(data)
    },
    func() fyne.CanvasObject {
        return widget.NewLabel("Template")
    },
    func(i widget.ListItemID, o fyne.CanvasObject) {
        o.(*widget.Label).SetText(data[i])
    },
)

// Evento de seleção
list.OnSelected = func(id widget.ListItemID) {
    fmt.Printf("Selecionado: %s\n", data[id])
}

// Evento de desseleção
list.OnUnselected = func(id widget.ListItemID) {
    fmt.Printf("Desselecionado: %s\n", data[id])
}
```

### Tree
Estrutura hierárquica em árvore.

```go
tree := widget.NewTree(
    func(uid widget.TreeNodeID) []widget.TreeNodeID {
        switch uid {
        case "":
            return []widget.TreeNodeID{"A", "B"}
        case "A":
            return []widget.TreeNodeID{"A1", "A2"}
        case "B":
            return []widget.TreeNodeID{"B1", "B2", "B3"}
        default:
            return []widget.TreeNodeID{}
        }
    },
    func(uid widget.TreeNodeID) bool {
        return uid == "" || uid == "A" || uid == "B"
    },
    func(branch bool) fyne.CanvasObject {
        if branch {
            return widget.NewLabel("Branch")
        }
        return widget.NewLabel("Leaf")
    },
    func(uid widget.TreeNodeID, branch bool, obj fyne.CanvasObject) {
        obj.(*widget.Label).SetText(string(uid))
    },
)

// Eventos
tree.OnSelected = func(uid widget.TreeNodeID) {
    fmt.Printf("Selecionado: %s\n", uid)
}
```

## Widgets de Mídia

### Icon
Exibição de ícones.

```go
// Ícones do tema
homeIcon := widget.NewIcon(theme.HomeIcon())
settingsIcon := widget.NewIcon(theme.SettingsIcon())

// Ícone customizado (de recurso)
customIcon := widget.NewIcon(resourceMyIconPng)
```

### Separator
Linha separadora.

```go
// Separador horizontal (padrão)
hSeparator := widget.NewSeparator()

// Em layout vertical, criar espaçamento visual
content := container.NewVBox(
    widget.NewLabel("Seção 1"),
    widget.NewSeparator(),
    widget.NewLabel("Seção 2"),
)
```

## Widgets de Formulário

### Form
Formulário estruturado com validação.

```go
form := &widget.Form{
    Items: []*widget.FormItem{
        {Text: "Nome", Widget: widget.NewEntry()},
        {Text: "Email", Widget: widget.NewEntry()},
        {Text: "Idade", Widget: widget.NewEntry()},
    },
    OnSubmit: func() {
        fmt.Println("Formulário submetido!")
        // Processar dados
    },
    OnCancel: func() {
        fmt.Println("Formulário cancelado!")
    },
}

// Adicionar validação
emailEntry := form.Items[1].Widget.(*widget.Entry)
emailEntry.Validator = validation.NewRegexp(`\S+@\S+\.\S+`, "Email inválido")
```

## Widgets de Diálogos

### Accordion
Painel expansível.

```go
accordion := widget.NewAccordion(
    widget.NewAccordionItem("Seção 1", widget.NewLabel("Conteúdo da seção 1")),
    widget.NewAccordionItem("Seção 2", widget.NewLabel("Conteúdo da seção 2")),
    widget.NewAccordionItem("Seção 3", widget.NewLabel("Conteúdo da seção 3")),
)

// Abrir seção específica
accordion.OpenAll()
accordion.CloseAll()
```

### Card
Cartão com título e conteúdo.

```go
card := widget.NewCard(
    "Título do Cartão",
    "Subtítulo opcional",
    widget.NewLabel("Conteúdo do cartão aqui"),
)

// Card sem subtítulo
simpleCard := widget.NewCard(
    "Título",
    "",
    container.NewVBox(
        widget.NewLabel("Item 1"),
        widget.NewLabel("Item 2"),
        widget.NewButton("Ação", func() {}),
    ),
)
```

## Layouts e Containers

### Container Básico
```go
// VBox - organização vertical
vbox := container.NewVBox(
    widget.NewLabel("Item 1"),
    widget.NewLabel("Item 2"),
    widget.NewLabel("Item 3"),
)

// HBox - organização horizontal  
hbox := container.NewHBox(
    widget.NewButton("Botão 1", nil),
    widget.NewButton("Botão 2", nil),
    widget.NewButton("Botão 3", nil),
)
```

### Border Layout
```go
border := container.NewBorder(
    widget.NewLabel("Topo"),      // top
    widget.NewLabel("Rodapé"),    // bottom
    widget.NewLabel("Esquerda"),  // left
    widget.NewLabel("Direita"),   // right
    widget.NewLabel("Centro"),    // center (preenche o restante)
)
```

### Grid Layout
```go
// Grid com colunas fixas
grid := container.NewGridWithColumns(3,
    widget.NewButton("1", nil),
    widget.NewButton("2", nil),
    widget.NewButton("3", nil),
    widget.NewButton("4", nil),
    widget.NewButton("5", nil),
    widget.NewButton("6", nil),
)

// Grid com linhas fixas
gridRows := container.NewGridWithRows(2,
    widget.NewLabel("A"),
    widget.NewLabel("B"),
    widget.NewLabel("C"),
    widget.NewLabel("D"),
)
```

### Tabs
```go
tabs := container.NewTabContainer(
    container.NewTabItem("Aba 1", widget.NewLabel("Conteúdo da aba 1")),
    container.NewTabItem("Aba 2", widget.NewLabel("Conteúdo da aba 2")),
    container.NewTabItem("Aba 3", widget.NewLabel("Conteúdo da aba 3")),
)

// Personalizar posição das abas
tabs.SetTabLocation(container.TabLocationLeading) // Esquerda
tabs.SetTabLocation(container.TabLocationTrailing) // Direita
tabs.SetTabLocation(container.TabLocationTop) // Topo (padrão)
tabs.SetTabLocation(container.TabLocationBottom) // Rodapé
```

### Split Container
```go
// Split horizontal (lado a lado)
hsplit := container.NewHSplit(
    widget.NewLabel("Painel Esquerdo"),
    widget.NewLabel("Painel Direito"),
)
hsplit.SetOffset(0.3) // 30% esquerda, 70% direita

// Split vertical (cima e baixo)
vsplit := container.NewVSplit(
    widget.NewLabel("Painel Superior"),
    widget.NewLabel("Painel Inferior"),
)
```

### Scroll Container
```go
// Conteúdo grande que precisa de scroll
largeContent := container.NewVBox()
for i := 0; i < 50; i++ {
    largeContent.Add(widget.NewLabel(fmt.Sprintf("Item %d", i+1)))
}

scroll := container.NewScroll(largeContent)
scroll.SetMinSize(fyne.NewSize(300, 200))
```

## Exemplo Completo

Aqui está um exemplo que combina vários widgets:

```go
package main

import (
    "fmt"
    "fyne.io/fyne/v2/app"
    "fyne.io/fyne/v2/container"
    "fyne.io/fyne/v2/widget"
)

func main() {
    myApp := app.New()
    myWindow := myApp.NewWindow("Showcase de Widgets")
    myWindow.Resize(fyne.NewSize(800, 600))

    // Seção de entrada
    nameEntry := widget.NewEntry()
    nameEntry.SetPlaceHolder("Seu nome...")
    
    emailEntry := widget.NewEntry()
    emailEntry.SetPlaceHolder("seu@email.com")
    
    ageSlider := widget.NewSlider(0, 100)
    ageSlider.SetValue(25)
    ageLabel := widget.NewLabel("Idade: 25")
    ageSlider.OnChanged = func(value float64) {
        ageLabel.SetText(fmt.Sprintf("Idade: %.0f", value))
    }

    // Seção de seleção
    genderRadio := widget.NewRadioGroup(
        []string{"Masculino", "Feminino", "Outro"}, 
        nil,
    )
    
    hobbies := widget.NewCheckGroup(
        []string{"Leitura", "Esportes", "Música", "Viagens"},
        nil,
    )

    // Seção de ações
    progressBar := widget.NewProgressBar()
    
    submitBtn := widget.NewButton("Enviar", func() {
        // Simular processamento
        go func() {
            for i := 0; i <= 100; i++ {
                progressBar.SetValue(float64(i) / 100)
                time.Sleep(20 * time.Millisecond)
            }
        }()
    })

    // Layout em abas
    tabs := container.NewTabContainer(
        container.NewTabItem("Dados Pessoais", container.NewVBox(
            widget.NewCard("Informações Básicas", "", container.NewVBox(
                widget.NewLabel("Nome:"),
                nameEntry,
                widget.NewLabel("Email:"),
                emailEntry,
                ageLabel,
                ageSlider,
            )),
        )),
        container.NewTabItem("Preferências", container.NewVBox(
            widget.NewCard("Gênero", "", genderRadio),
            widget.NewCard("Hobbies", "", hobbies),
        )),
        container.NewTabItem("Envio", container.NewVBox(
            progressBar,
            submitBtn,
        )),
    )

    myWindow.SetContent(tabs)
    myWindow.ShowAndRun()
}
```

## Próximos Passos

Agora que você conhece todos os componentes básicos, continue para [Backend Embutido](../backend-embebido/index.md) onde aprenderá como integrar binários externos em suas aplicações Fyne.

---

**💡 Dica**: Experimente combinar diferentes widgets e layouts para criar interfaces únicas. O Fyne oferece grande flexibilidade na composição de elementos!