# Configuração e Persistência de Dados

Esta seção aborda como salvar e gerenciar configurações da aplicação usando o sistema de preferências do Fyne.

## Visão Geral

O Fyne oferece um sistema robusto de persistência de dados através da API de Preferências, que permite salvar configurações do usuário de forma automática e multiplataforma.

### Características Principais
- Armazenamento automático em local apropriado para cada plataforma
- Suporte a tipos básicos: bool, float64, int, string e listas
- Sincronização automática com debouncing para evitar escritas excessivas
- Codificação JSON para portabilidade

## Configurando Aplicação com ID

Para usar preferências, sua aplicação precisa ter um ID único:

```go
package main

import (
    "fyne.io/fyne/v2/app"
    "fyne.io/fyne/v2/widget"
)

func main() {
    // Criar app com ID único
    myApp := app.NewWithID("com.exemplo.meuapp")
    
    // Agora você pode usar preferências
    prefs := myApp.Preferences()
    
    window := myApp.NewWindow("App com Configurações")
    window.ShowAndRun()
}
```

## API de Preferências

### Tipos de Dados Suportados

O sistema de preferências suporta os seguintes tipos:

```go
// String
prefs.SetString("username", "João")
username := prefs.String("username")
usernameWithDefault := prefs.StringWithFallback("username", "Usuário")

// Integer
prefs.SetInt("windowWidth", 800)
width := prefs.Int("windowWidth")
widthWithDefault := prefs.IntWithFallback("windowWidth", 640)

// Float
prefs.SetFloat("volume", 0.8)
volume := prefs.Float("volume")
volumeWithDefault := prefs.FloatWithFallback("volume", 1.0)

// Boolean
prefs.SetBool("darkMode", true)
darkMode := prefs.Bool("darkMode")
darkModeWithDefault := prefs.BoolWithFallback("darkMode", false)
```

### Listas de Valores

```go
// Lista de strings
prefs.SetStringList("recentFiles", []string{"file1.txt", "file2.txt"})
recentFiles := prefs.StringList("recentFiles")

// Lista de inteiros
prefs.SetIntList("scores", []int{100, 85, 92})
scores := prefs.IntList("scores")

// Lista de floats
prefs.SetFloatList("coordinates", []float64{10.5, 20.3, 30.8})
coords := prefs.FloatList("coordinates")

// Lista de booleans
prefs.SetBoolList("features", []bool{true, false, true})
features := prefs.BoolList("features")
```

## Exemplo Prático: Aplicação de Configurações

```go
package main

import (
    "fmt"
    "time"
    
    "fyne.io/fyne/v2/app"
    "fyne.io/fyne/v2/container"
    "fyne.io/fyne/v2/dialog"
    "fyne.io/fyne/v2/theme"
    "fyne.io/fyne/v2/widget"
)

type AppConfig struct {
    app        fyne.App
    window     fyne.Window
    prefs      fyne.Preferences
    
    // Configurações da aplicação
    Username   string
    Theme      string
    Language   string
    AutoSave   bool
    SaveInterval int
    WindowSize fyne.Size
    RecentFiles []string
}

func NewAppConfig() *AppConfig {
    myApp := app.NewWithID("com.exemplo.configuracoes")
    
    config := &AppConfig{
        app:   myApp,
        prefs: myApp.Preferences(),
    }
    
    // Carregar configurações salvas
    config.LoadConfig()
    
    return config
}

func (ac *AppConfig) LoadConfig() {
    ac.Username = ac.prefs.StringWithFallback("username", "Usuário")
    ac.Theme = ac.prefs.StringWithFallback("theme", "light")
    ac.Language = ac.prefs.StringWithFallback("language", "pt")
    ac.AutoSave = ac.prefs.BoolWithFallback("autoSave", true)
    ac.SaveInterval = ac.prefs.IntWithFallback("saveInterval", 30)
    
    // Carregar tamanho da janela
    width := ac.prefs.FloatWithFallback("windowWidth", 800)
    height := ac.prefs.FloatWithFallback("windowHeight", 600)
    ac.WindowSize = fyne.NewSize(float32(width), float32(height))
    
    // Carregar arquivos recentes
    ac.RecentFiles = ac.prefs.StringList("recentFiles")
    
    fmt.Printf("Configurações carregadas:\n")
    fmt.Printf("- Usuário: %s\n", ac.Username)
    fmt.Printf("- Tema: %s\n", ac.Theme)
    fmt.Printf("- Auto-salvar: %t\n", ac.AutoSave)
    fmt.Printf("- Tamanho: %.0fx%.0f\n", ac.WindowSize.Width, ac.WindowSize.Height)
}

func (ac *AppConfig) SaveConfig() {
    ac.prefs.SetString("username", ac.Username)
    ac.prefs.SetString("theme", ac.Theme)
    ac.prefs.SetString("language", ac.Language)
    ac.prefs.SetBool("autoSave", ac.AutoSave)
    ac.prefs.SetInt("saveInterval", ac.SaveInterval)
    
    // Salvar tamanho atual da janela
    if ac.window != nil {
        size := ac.window.Content().Size()
        ac.prefs.SetFloat("windowWidth", float64(size.Width))
        ac.prefs.SetFloat("windowHeight", float64(size.Height))
    }
    
    // Salvar arquivos recentes
    ac.prefs.SetStringList("recentFiles", ac.RecentFiles)
    
    fmt.Println("Configurações salvas!")
}

func (ac *AppConfig) CreateUI() {
    ac.window = ac.app.NewWindow("Configurações da Aplicação")
    ac.window.Resize(ac.WindowSize)
    
    // Aplicar tema carregado
    if ac.Theme == "dark" {
        ac.app.Settings().SetTheme(theme.DarkTheme())
    } else {
        ac.app.Settings().SetTheme(theme.LightTheme())
    }
    
    // Interface de configurações
    content := ac.createConfigInterface()
    
    // Salvar configurações ao fechar
    ac.window.SetOnClosed(func() {
        ac.SaveConfig()
    })
    
    ac.window.SetContent(content)
}

func (ac *AppConfig) createConfigInterface() fyne.CanvasObject {
    // Configurações do usuário
    usernameEntry := widget.NewEntry()
    usernameEntry.SetText(ac.Username)
    usernameEntry.OnChanged = func(text string) {
        ac.Username = text
        ac.SaveConfig() // Salvar imediatamente
    }
    
    // Seleção de tema
    themeSelect := widget.NewSelect(
        []string{"light", "dark"}, 
        func(selected string) {
            ac.Theme = selected
            if selected == "dark" {
                ac.app.Settings().SetTheme(theme.DarkTheme())
            } else {
                ac.app.Settings().SetTheme(theme.LightTheme())
            }
            ac.SaveConfig()
        },
    )
    themeSelect.SetSelected(ac.Theme)
    
    // Seleção de idioma
    languageSelect := widget.NewSelect(
        []string{"pt", "en", "es"}, 
        func(selected string) {
            ac.Language = selected
            ac.SaveConfig()
        },
    )
    languageSelect.SetSelected(ac.Language)
    
    // Auto-salvar
    autoSaveCheck := widget.NewCheck("Ativar auto-salvamento", func(checked bool) {
        ac.AutoSave = checked
        ac.SaveConfig()
    })
    autoSaveCheck.SetChecked(ac.AutoSave)
    
    // Intervalo de salvamento
    intervalSlider := widget.NewSlider(5, 300)
    intervalSlider.SetValue(float64(ac.SaveInterval))
    intervalSlider.Step = 5
    
    intervalLabel := widget.NewLabel(fmt.Sprintf("Intervalo: %d segundos", ac.SaveInterval))
    intervalSlider.OnChanged = func(value float64) {
        ac.SaveInterval = int(value)
        intervalLabel.SetText(fmt.Sprintf("Intervalo: %d segundos", ac.SaveInterval))
        ac.SaveConfig()
    }
    
    // Lista de arquivos recentes
    recentFilesList := widget.NewList(
        func() int { return len(ac.RecentFiles) },
        func() fyne.CanvasObject {
            return container.NewHBox(
                widget.NewLabel("Arquivo"),
                widget.NewButton("Remover", func() {}),
            )
        },
        func(i widget.ListItemID, o fyne.CanvasObject) {
            if i < len(ac.RecentFiles) {
                container := o.(*container.Container)
                label := container.Objects[0].(*widget.Label)
                button := container.Objects[1].(*widget.Button)
                
                label.SetText(ac.RecentFiles[i])
                button.OnTapped = func() {
                    ac.RemoveRecentFile(i)
                }
            }
        },
    )
    
    // Botões de ação
    addFileBtn := widget.NewButton("Adicionar Arquivo", func() {
        dialog.ShowFileOpen(func(file fyne.URIReadCloser) {
            if file != nil {
                ac.AddRecentFile(file.URI().Path())
                file.Close()
            }
        }, ac.window)
    })
    
    clearBtn := widget.NewButton("Limpar Lista", func() {
        dialog.ShowConfirm("Confirmar", "Limpar lista de arquivos recentes?", 
            func(confirmed bool) {
                if confirmed {
                    ac.RecentFiles = []string{}
                    ac.SaveConfig()
                    recentFilesList.Refresh()
                }
            }, ac.window)
    })
    
    resetBtn := widget.NewButton("Resetar Configurações", func() {
        dialog.ShowConfirm("Confirmar", "Resetar todas as configurações?", 
            func(confirmed bool) {
                if confirmed {
                    ac.ResetConfig()
                }
            }, ac.window)
    })
    
    // Layout
    userSection := widget.NewCard("Usuário", "", container.NewVBox(
        widget.NewLabel("Nome:"),
        usernameEntry,
    ))
    
    appearanceSection := widget.NewCard("Aparência", "", container.NewVBox(
        widget.NewLabel("Tema:"),
        themeSelect,
        widget.NewLabel("Idioma:"),
        languageSelect,
    ))
    
    behaviorSection := widget.NewCard("Comportamento", "", container.NewVBox(
        autoSaveCheck,
        intervalLabel,
        intervalSlider,
    ))
    
    filesSection := widget.NewCard("Arquivos Recentes", "", container.NewVBox(
        container.NewHBox(addFileBtn, clearBtn),
        recentFilesList,
    ))
    
    actionsSection := widget.NewCard("Ações", "", container.NewVBox(
        resetBtn,
    ))
    
    // Tabs para organizar
    tabs := container.NewTabContainer(
        container.NewTabItem("Usuário", userSection),
        container.NewTabItem("Aparência", appearanceSection),  
        container.NewTabItem("Comportamento", behaviorSection),
        container.NewTabItem("Arquivos", filesSection),
        container.NewTabItem("Avançado", actionsSection),
    )
    
    return tabs
}

func (ac *AppConfig) AddRecentFile(filePath string) {
    // Remover se já existe
    for i, file := range ac.RecentFiles {
        if file == filePath {
            ac.RecentFiles = append(ac.RecentFiles[:i], ac.RecentFiles[i+1:]...)
            break
        }
    }
    
    // Adicionar no início
    ac.RecentFiles = append([]string{filePath}, ac.RecentFiles...)
    
    // Manter apenas os últimos 10
    if len(ac.RecentFiles) > 10 {
        ac.RecentFiles = ac.RecentFiles[:10]
    }
    
    ac.SaveConfig()
}

func (ac *AppConfig) RemoveRecentFile(index int) {
    if index >= 0 && index < len(ac.RecentFiles) {
        ac.RecentFiles = append(ac.RecentFiles[:index], ac.RecentFiles[index+1:]...)
        ac.SaveConfig()
    }
}

func (ac *AppConfig) ResetConfig() {
    // Valores padrão
    ac.Username = "Usuário"
    ac.Theme = "light"
    ac.Language = "pt"
    ac.AutoSave = true
    ac.SaveInterval = 30
    ac.WindowSize = fyne.NewSize(800, 600)
    ac.RecentFiles = []string{}
    
    // Salvar e recriar interface
    ac.SaveConfig()
    ac.window.Close()
    ac.CreateUI()
    ac.window.Show()
}

func (ac *AppConfig) Run() {
    ac.CreateUI()
    ac.window.ShowAndRun()
}

func main() {
    config := NewAppConfig()
    config.Run()
}
```

## Exemplo Avançado: Sistema de Configuração Tipado

```go
package main

import (
    "encoding/json"
    "fmt"
    
    "fyne.io/fyne/v2/app"
    "fyne.io/fyne/v2/widget"
)

// Estrutura de configuração complexa
type DatabaseConfig struct {
    Host     string `json:"host"`
    Port     int    `json:"port"`
    Database string `json:"database"`
    Username string `json:"username"`
    Password string `json:"password"`
    SSL      bool   `json:"ssl"`
}

type UIConfig struct {
    Theme        string  `json:"theme"`
    FontSize     float64 `json:"fontSize"`
    ShowToolbar  bool    `json:"showToolbar"`
    ShowSidebar  bool    `json:"showSidebar"`
    WindowWidth  float64 `json:"windowWidth"`
    WindowHeight float64 `json:"windowHeight"`
}

type AppSettings struct {
    Database     DatabaseConfig   `json:"database"`
    UI           UIConfig         `json:"ui"`
    RecentFiles  []string         `json:"recentFiles"`
    Shortcuts    map[string]string `json:"shortcuts"`
    LastOpened   string           `json:"lastOpened"`
}

type ConfigManager struct {
    app      fyne.App
    prefs    fyne.Preferences
    settings AppSettings
}

func NewConfigManager(appID string) *ConfigManager {
    myApp := app.NewWithID(appID)
    
    cm := &ConfigManager{
        app:   myApp,
        prefs: myApp.Preferences(),
    }
    
    cm.LoadSettings()
    return cm
}

func (cm *ConfigManager) LoadSettings() {
    // Carregar configuração JSON das preferências
    configJSON := cm.prefs.StringWithFallback("appSettings", "")
    
    if configJSON != "" {
        err := json.Unmarshal([]byte(configJSON), &cm.settings)
        if err != nil {
            fmt.Printf("Erro ao carregar configurações: %v\n", err)
            cm.setDefaultSettings()
        }
    } else {
        cm.setDefaultSettings()
    }
}

func (cm *ConfigManager) SaveSettings() {
    configJSON, err := json.Marshal(cm.settings)
    if err != nil {
        fmt.Printf("Erro ao salvar configurações: %v\n", err)
        return
    }
    
    cm.prefs.SetString("appSettings", string(configJSON))
    fmt.Println("Configurações salvas com sucesso!")
}

func (cm *ConfigManager) setDefaultSettings() {
    cm.settings = AppSettings{
        Database: DatabaseConfig{
            Host:     "localhost",
            Port:     5432,
            Database: "myapp",
            Username: "user",
            Password: "",
            SSL:      false,
        },
        UI: UIConfig{
            Theme:        "light",
            FontSize:     12.0,
            ShowToolbar:  true,
            ShowSidebar:  true,
            WindowWidth:  1024,
            WindowHeight: 768,
        },
        RecentFiles: []string{},
        Shortcuts: map[string]string{
            "save":     "Ctrl+S",
            "open":     "Ctrl+O",
            "new":      "Ctrl+N",
            "quit":     "Ctrl+Q",
        },
        LastOpened: "",
    }
}

// Métodos para acessar configurações específicas
func (cm *ConfigManager) GetDatabaseConfig() DatabaseConfig {
    return cm.settings.Database
}

func (cm *ConfigManager) SetDatabaseConfig(config DatabaseConfig) {
    cm.settings.Database = config
    cm.SaveSettings()
}

func (cm *ConfigManager) GetUIConfig() UIConfig {
    return cm.settings.UI
}

func (cm *ConfigManager) SetUIConfig(config UIConfig) {
    cm.settings.UI = config
    cm.SaveSettings()
}

func (cm *ConfigManager) AddRecentFile(filePath string) {
    // Remove duplicatas
    for i, file := range cm.settings.RecentFiles {
        if file == filePath {
            cm.settings.RecentFiles = append(
                cm.settings.RecentFiles[:i], 
                cm.settings.RecentFiles[i+1:]...,
            )
            break
        }
    }
    
    // Adiciona no início
    cm.settings.RecentFiles = append([]string{filePath}, cm.settings.RecentFiles...)
    
    // Mantém apenas os últimos 10
    if len(cm.settings.RecentFiles) > 10 {
        cm.settings.RecentFiles = cm.settings.RecentFiles[:10]
    }
    
    cm.SaveSettings()
}

func main() {
    config := NewConfigManager("com.exemplo.configavancada")
    
    window := config.app.NewWindow("Configuração Avançada")
    
    // Mostrar configurações atuais
    dbConfig := config.GetDatabaseConfig()
    uiConfig := config.GetUIConfig()
    
    info := widget.NewMultiLineEntry()
    info.SetText(fmt.Sprintf(`Configurações Atuais:

Database:
- Host: %s
- Port: %d
- Database: %s
- SSL: %t

UI:
- Theme: %s
- Font Size: %.1f
- Window: %.0fx%.0f

Recent Files: %d items
`, 
        dbConfig.Host, dbConfig.Port, dbConfig.Database, dbConfig.SSL,
        uiConfig.Theme, uiConfig.FontSize, uiConfig.WindowWidth, uiConfig.WindowHeight,
        len(config.settings.RecentFiles),
    ))
    
    window.SetContent(info)
    window.Resize(fyne.NewSize(600, 400))
    window.ShowAndRun()
}
```

## Localização dos Arquivos de Configuração

### Por Plataforma

```go
package main

import (
    "fmt"
    "path/filepath"
    
    "fyne.io/fyne/v2/app"
    "fyne.io/fyne/v2/storage"
)

func showConfigLocations() {
    myApp := app.NewWithID("com.exemplo.locais")
    
    // Diretório raiz de configurações
    configDir := myApp.Storage().RootURI().Path()
    
    fmt.Printf("Localização das configurações:\n")
    fmt.Printf("- Root: %s\n", configDir)
    
    // Arquivo específico de preferências
    prefsFile := filepath.Join(configDir, "settings.json")
    fmt.Printf("- Preferências: %s\n", prefsFile)
    
    // No Windows: %APPDATA%\{AppID}\
    // No macOS: ~/Library/Preferences/{AppID}/
    // No Linux: ~/.config/{AppID}/
}
```

## Migração de Configurações

```go
type ConfigMigrator struct {
    prefs fyne.Preferences
}

func (cm *ConfigMigrator) MigrateFromVersion(fromVersion, toVersion string) error {
    switch {
    case fromVersion == "1.0" && toVersion == "2.0":
        return cm.migrateFrom1To2()
    case fromVersion == "2.0" && toVersion == "3.0":
        return cm.migrateFrom2To3()
    default:
        return fmt.Errorf("migração não suportada: %s -> %s", fromVersion, toVersion)
    }
}

func (cm *ConfigMigrator) migrateFrom1To2() error {
    // Exemplo: renomear chave
    if oldValue := cm.prefs.String("oldKey"); oldValue != "" {
        cm.prefs.SetString("newKey", oldValue)
        cm.prefs.RemoveValue("oldKey") // Se suportado
    }
    
    cm.prefs.SetString("configVersion", "2.0")
    return nil
}
```

## Próximos Passos

Continue para [Compilação Cross-Platform](../cross-platform/index.md) onde aprenderá como compilar sua aplicação Fyne para diferentes plataformas.

---

**💡 Dica**: Use IDs únicos no formato de domínio reverso (ex: "com.suaempresa.seuapp") para evitar conflitos entre aplicações!