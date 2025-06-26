# Comunicação com Back-end via Binários Embutidos

Esta seção mostra como embeber e se comunicar com back-ends externos em aplicações Fyne, uma técnica poderosa para criar aplicações auto-contidas.

## Visão Geral

Embeber binários permite que sua aplicação Fyne:
- Execute serviços back-end sem instalação separada
- Funcione offline sem dependências externas
- Mantenha toda a lógica em um único executável
- Comunique-se via IPC, sockets ou HTTP local

## Embutindo Binários com embed

### Preparação dos Binários

Primeiro, compile seus binários para diferentes plataformas:

```bash
# Estrutura do projeto
projeto/
├── cmd/
│   ├── gui/main.go          # Interface Fyne
│   └── server/main.go       # Servidor back-end
├── binaries/
│   ├── server-linux
│   ├── server-windows.exe
│   └── server-darwin
└── internal/
    └── backend/manager.go   # Gerenciador de backend
```

### Compilando Back-end para Múltiplas Plataformas

```bash
# Linux
GOOS=linux GOARCH=amd64 go build -o binaries/server-linux cmd/server/main.go

# Windows  
GOOS=windows GOARCH=amd64 go build -o binaries/server-windows.exe cmd/server/main.go

# macOS
GOOS=darwin GOARCH=amd64 go build -o binaries/server-darwin cmd/server/main.go
```

### Embutir os Binários

```go
package main

import (
    _ "embed"
    "fmt"
    "io/ioutil"
    "os"
    "os/exec"
    "path/filepath"
    "runtime"
    
    "fyne.io/fyne/v2/app"
    "fyne.io/fyne/v2/container"
    "fyne.io/fyne/v2/widget"
)

// Embutir binários para diferentes plataformas
//go:embed binaries/server-linux
var serverLinux []byte

//go:embed binaries/server-windows.exe
var serverWindows []byte

//go:embed binaries/server-darwin
var serverDarwin []byte

type BackendManager struct {
    serverPath string
    serverCmd  *exec.Cmd
    isRunning  bool
}

func NewBackendManager() *BackendManager {
    return &BackendManager{}
}

func (bm *BackendManager) ExtractAndStartServer() error {
    // Determinar qual binário usar baseado na plataforma
    var binaryData []byte
    var fileName string
    
    switch runtime.GOOS {
    case "linux":
        binaryData = serverLinux
        fileName = "server-linux"
    case "windows":
        binaryData = serverWindows
        fileName = "server-windows.exe"
    case "darwin":
        binaryData = serverDarwin
        fileName = "server-darwin"
    default:
        return fmt.Errorf("plataforma não suportada: %s", runtime.GOOS)
    }
    
    // Criar diretório temporário
    tempDir, err := ioutil.TempDir("", "app-backend")
    if err != nil {
        return fmt.Errorf("erro ao criar diretório temporário: %v", err)
    }
    
    // Caminho do binário
    bm.serverPath = filepath.Join(tempDir, fileName)
    
    // Escrever binário no sistema de arquivos
    err = ioutil.WriteFile(bm.serverPath, binaryData, 0755)
    if err != nil {
        return fmt.Errorf("erro ao escrever binário: %v", err)
    }
    
    // Iniciar servidor
    bm.serverCmd = exec.Command(bm.serverPath, "--port=8080", "--quiet")
    err = bm.serverCmd.Start()
    if err != nil {
        return fmt.Errorf("erro ao iniciar servidor: %v", err)
    }
    
    bm.isRunning = true
    fmt.Printf("Servidor iniciado com PID: %d\n", bm.serverCmd.Process.Pid)
    return nil
}

func (bm *BackendManager) StopServer() error {
    if bm.serverCmd != nil && bm.serverCmd.Process != nil {
        err := bm.serverCmd.Process.Kill()
        if err != nil {
            return fmt.Errorf("erro ao parar servidor: %v", err)
        }
        
        // Aguardar finalização
        bm.serverCmd.Wait()
        
        // Limpar arquivo temporário
        if bm.serverPath != "" {
            os.Remove(bm.serverPath)
            os.Remove(filepath.Dir(bm.serverPath))
        }
        
        bm.isRunning = false
    }
    return nil
}

func (bm *BackendManager) IsRunning() bool {
    return bm.isRunning
}
```

## Comunicação via HTTP Local

### Cliente HTTP para Backend Local

```go
package main

import (
    "bytes"
    "encoding/json"
    "fmt"
    "io/ioutil"
    "net/http"
    "time"
)

type APIClient struct {
    baseURL string
    client  *http.Client
}

func NewAPIClient(port int) *APIClient {
    return &APIClient{
        baseURL: fmt.Sprintf("http://localhost:%d", port),
        client: &http.Client{
            Timeout: 10 * time.Second,
        },
    }
}

func (api *APIClient) HealthCheck() error {
    resp, err := api.client.Get(api.baseURL + "/health")
    if err != nil {
        return err
    }
    defer resp.Body.Close()
    
    if resp.StatusCode != http.StatusOK {
        return fmt.Errorf("servidor não está saudável: %d", resp.StatusCode)
    }
    
    return nil
}

func (api *APIClient) GetUsers() ([]User, error) {
    resp, err := api.client.Get(api.baseURL + "/api/users")
    if err != nil {
        return nil, err
    }
    defer resp.Body.Close()
    
    body, err := ioutil.ReadAll(resp.Body)
    if err != nil {
        return nil, err
    }
    
    var users []User
    err = json.Unmarshal(body, &users)
    return users, err
}

func (api *APIClient) CreateUser(user User) error {
    jsonData, err := json.Marshal(user)
    if err != nil {
        return err
    }
    
    resp, err := api.client.Post(
        api.baseURL+"/api/users",
        "application/json",
        bytes.NewBuffer(jsonData),
    )
    if err != nil {
        return err
    }
    defer resp.Body.Close()
    
    if resp.StatusCode != http.StatusCreated {
        return fmt.Errorf("erro ao criar usuário: %d", resp.StatusCode)
    }
    
    return nil
}

type User struct {
    ID    int    `json:"id"`
    Name  string `json:"name"`
    Email string `json:"email"`
}
```

### Interface Fyne Integrada

```go
package main

import (
    "fmt"
    "time"
    
    "fyne.io/fyne/v2/app"
    "fyne.io/fyne/v2/container"
    "fyne.io/fyne/v2/widget"
)

func main() {
    myApp := app.New()
    myWindow := myApp.NewWindow("App com Backend Embutido")
    myWindow.Resize(fyne.NewSize(600, 500))

    // Gerenciadores
    backend := NewBackendManager()
    var apiClient *APIClient
    
    // Widgets de status
    statusLabel := widget.NewLabel("Backend: Parado")
    logArea := widget.NewMultiLineEntry()
    logArea.SetMinRowsVisible(8)
    
    // Lista de usuários
    userList := widget.NewList(
        func() int { return 0 }, // Será atualizado dinamicamente
        func() fyne.CanvasObject {
            return widget.NewLabel("Template")
        },
        func(i widget.ListItemID, o fyne.CanvasObject) {
            // Será implementado quando tivermos dados
        },
    )
    
    var users []User
    
    updateUserList := func() {
        if apiClient == nil {
            return
        }
        
        var err error
        users, err = apiClient.GetUsers()
        if err != nil {
            logArea.SetText(logArea.Text + fmt.Sprintf("Erro ao carregar usuários: %v\n", err))
            return
        }
        
        // Atualizar lista
        userList.Length = func() int { return len(users) }
        userList.UpdateItem = func(i widget.ListItemID, o fyne.CanvasObject) {
            if i < len(users) {
                o.(*widget.Label).SetText(fmt.Sprintf("%s (%s)", users[i].Name, users[i].Email))
            }
        }
        userList.Refresh()
    }
    
    // Botões de controle do backend
    startBtn := widget.NewButton("Iniciar Backend", func() {
        statusLabel.SetText("Backend: Iniciando...")
        logArea.SetText(logArea.Text + "Iniciando backend...\n")
        
        go func() {
            err := backend.ExtractAndStartServer()
            if err != nil {
                statusLabel.SetText("Backend: Erro")
                logArea.SetText(logArea.Text + fmt.Sprintf("Erro: %v\n", err))
                return
            }
            
            // Aguardar backend ficar disponível
            apiClient = NewAPIClient(8080)
            for i := 0; i < 30; i++ { // Tentar por 30 segundos
                err := apiClient.HealthCheck()
                if err == nil {
                    break
                }
                time.Sleep(1 * time.Second)
            }
            
            statusLabel.SetText("Backend: Executando")
            logArea.SetText(logArea.Text + "Backend iniciado com sucesso!\n")
            updateUserList()
        }()
    })
    
    stopBtn := widget.NewButton("Parar Backend", func() {
        err := backend.StopServer()
        if err != nil {
            logArea.SetText(logArea.Text + fmt.Sprintf("Erro ao parar: %v\n", err))
        } else {
            statusLabel.SetText("Backend: Parado")
            logArea.SetText(logArea.Text + "Backend parado.\n")
            apiClient = nil
            users = nil
            userList.Refresh()
        }
    })
    
    // Formulário para adicionar usuário
    nameEntry := widget.NewEntry()
    nameEntry.SetPlaceHolder("Nome do usuário")
    
    emailEntry := widget.NewEntry()
    emailEntry.SetPlaceHolder("Email do usuário")
    
    addUserBtn := widget.NewButton("Adicionar Usuário", func() {
        if apiClient == nil {
            logArea.SetText(logArea.Text + "Backend não está executando!\n")
            return
        }
        
        if nameEntry.Text == "" || emailEntry.Text == "" {
            logArea.SetText(logArea.Text + "Preencha nome e email!\n")
            return
        }
        
        user := User{
            Name:  nameEntry.Text,
            Email: emailEntry.Text,
        }
        
        go func() {
            err := apiClient.CreateUser(user)
            if err != nil {
                logArea.SetText(logArea.Text + fmt.Sprintf("Erro ao criar usuário: %v\n", err))
            } else {
                logArea.SetText(logArea.Text + fmt.Sprintf("Usuário %s criado!\n", user.Name))
                nameEntry.SetText("")
                emailEntry.SetText("")
                updateUserList()
            }
        }()
    })
    
    refreshBtn := widget.NewButton("Atualizar Lista", func() {
        updateUserList()
    })
    
    // Layout da interface
    controlPanel := container.NewVBox(
        widget.NewCard("Status do Backend", "", container.NewVBox(
            statusLabel,
            container.NewHBox(startBtn, stopBtn),
        )),
        widget.NewCard("Adicionar Usuário", "", container.NewVBox(
            nameEntry,
            emailEntry,
            addUserBtn,
        )),
    )
    
    mainContent := container.NewHSplit(
        controlPanel,
        container.NewVBox(
            container.NewHBox(
                widget.NewLabel("Usuários"),
                refreshBtn,
            ),
            userList,
        ),
    )
    mainContent.SetOffset(0.4)
    
    tabs := container.NewTabContainer(
        container.NewTabItem("Principal", mainContent),
        container.NewTabItem("Logs", container.NewScroll(logArea)),
    )
    
    // Limpeza ao fechar
    myWindow.SetOnClosed(func() {
        backend.StopServer()
    })
    
    myWindow.SetContent(tabs)
    myWindow.ShowAndRun()
}
```

## Comunicação via Pipes/Sockets

### Comunicação via Named Pipes (Unix Sockets)

```go
package main

import (
    "bufio"
    "encoding/json"
    "fmt"
    "net"
    "os"
    "time"
)

type IPCClient struct {
    conn       net.Conn
    socketPath string
}

func NewIPCClient(socketPath string) *IPCClient {
    return &IPCClient{
        socketPath: socketPath,
    }
}

func (ipc *IPCClient) Connect() error {
    var err error
    
    // Tentar conectar várias vezes
    for i := 0; i < 10; i++ {
        ipc.conn, err = net.Dial("unix", ipc.socketPath)
        if err == nil {
            return nil
        }
        time.Sleep(500 * time.Millisecond)
    }
    
    return fmt.Errorf("não foi possível conectar após 10 tentativas: %v", err)
}

func (ipc *IPCClient) SendMessage(msg Message) (*Message, error) {
    if ipc.conn == nil {
        return nil, fmt.Errorf("não conectado")
    }
    
    // Serializar mensagem
    data, err := json.Marshal(msg)
    if err != nil {
        return nil, err
    }
    
    // Enviar
    _, err = ipc.conn.Write(append(data, '\n'))
    if err != nil {
        return nil, err
    }
    
    // Receber resposta
    reader := bufio.NewReader(ipc.conn)
    line, err := reader.ReadString('\n')
    if err != nil {
        return nil, err
    }
    
    var response Message
    err = json.Unmarshal([]byte(line), &response)
    return &response, err
}

func (ipc *IPCClient) Close() error {
    if ipc.conn != nil {
        return ipc.conn.Close()
    }
    return nil
}

type Message struct {
    Type      string                 `json:"type"`
    ID        string                 `json:"id,omitempty"`
    Data      interface{}            `json:"data,omitempty"`
    Error     string                 `json:"error,omitempty"`
    Timestamp time.Time              `json:"timestamp"`
}
```

### Interface com IPC

```go
func exemploIPC() {
    myApp := app.New()
    myWindow := myApp.NewWindow("Comunicação IPC")
    myWindow.Resize(fyne.NewSize(700, 500))

    backend := NewBackendManager()
    ipcClient := NewIPCClient("/tmp/app-backend.sock")
    
    statusLabel := widget.NewLabel("Status: Desconectado")
    
    // Console de comandos
    commandEntry := widget.NewEntry()
    commandEntry.SetPlaceHolder("Digite um comando...")
    
    responseArea := widget.NewMultiLineEntry()
    responseArea.SetMinRowsVisible(15)
    
    // Histórico de comandos
    var commandHistory []string
    historyIndex := -1
    
    sendCommand := func(command string) {
        if ipcClient.conn == nil {
            responseArea.SetText(responseArea.Text + "❌ Não conectado!\n")
            return
        }
        
        msg := Message{
            Type:      "command",
            Data:      command,
            Timestamp: time.Now(),
        }
        
        response, err := ipcClient.SendMessage(msg)
        if err != nil {
            responseArea.SetText(responseArea.Text + fmt.Sprintf("❌ Erro: %v\n", err))
            return
        }
        
        if response.Error != "" {
            responseArea.SetText(responseArea.Text + fmt.Sprintf("❌ %s\n", response.Error))
        } else {
            responseArea.SetText(responseArea.Text + fmt.Sprintf("✅ %v\n", response.Data))
        }
        
        // Adicionar ao histórico
        commandHistory = append(commandHistory, command)
        historyIndex = len(commandHistory)
        
        // Auto-scroll
        responseArea.CursorRow = len(responseArea.Text)
        responseArea.Refresh()
    }
    
    commandEntry.OnSubmitted = func(text string) {
        if text != "" {
            responseArea.SetText(responseArea.Text + fmt.Sprintf("🔵 > %s\n", text))
            sendCommand(text)
            commandEntry.SetText("")
        }
    }
    
    // Navegação no histórico
    commandEntry.OnTypedKey = func(key *fyne.KeyEvent) {
        switch key.Name {
        case fyne.KeyUp:
            if historyIndex > 0 {
                historyIndex--
                commandEntry.SetText(commandHistory[historyIndex])
            }
        case fyne.KeyDown:
            if historyIndex < len(commandHistory)-1 {
                historyIndex++
                commandEntry.SetText(commandHistory[historyIndex])
            } else if historyIndex == len(commandHistory)-1 {
                historyIndex = len(commandHistory)
                commandEntry.SetText("")
            }
        }
    }
    
    // Botões de controle
    startBtn := widget.NewButton("Iniciar Backend", func() {
        go func() {
            err := backend.ExtractAndStartServer()
            if err != nil {
                statusLabel.SetText("Status: Erro ao iniciar")
                responseArea.SetText(responseArea.Text + fmt.Sprintf("❌ Erro: %v\n", err))
                return
            }
            
            // Conectar via IPC
            time.Sleep(2 * time.Second) // Aguardar servidor inicializar
            err = ipcClient.Connect()
            if err != nil {
                statusLabel.SetText("Status: Erro na conexão IPC")
                responseArea.SetText(responseArea.Text + fmt.Sprintf("❌ IPC: %v\n", err))
                return
            }
            
            statusLabel.SetText("Status: Conectado via IPC")
            responseArea.SetText(responseArea.Text + "🟢 Backend iniciado e conectado via IPC!\n")
        }()
    })
    
    stopBtn := widget.NewButton("Parar Backend", func() {
        ipcClient.Close()
        backend.StopServer()
        statusLabel.SetText("Status: Desconectado")
        responseArea.SetText(responseArea.Text + "🔴 Backend parado.\n")
    })
    
    clearBtn := widget.NewButton("Limpar Console", func() {
        responseArea.SetText("")
    })
    
    // Comandos pré-definidos
    quickCommands := []string{
        "status",
        "list-users",
        "get-config",
        "ping",
    }
    
    quickButtonsContainer := container.NewHBox()
    for _, cmd := range quickCommands {
        cmd := cmd // Capture para closure
        btn := widget.NewButton(cmd, func() {
            commandEntry.SetText(cmd)
            sendCommand(cmd)
            commandEntry.SetText("")
        })
        quickButtonsContainer.Add(btn)
    }
    
    // Layout
    content := container.NewVBox(
        widget.NewCard("Controle", "", container.NewVBox(
            statusLabel,
            container.NewHBox(startBtn, stopBtn, clearBtn),
        )),
        widget.NewCard("Comandos Rápidos", "", quickButtonsContainer),
        widget.NewCard("Console", "", container.NewVBox(
            container.NewHBox(
                widget.NewLabel("Comando:"),
                commandEntry,
            ),
            container.NewScroll(responseArea),
        )),
    )
    
    myWindow.SetOnClosed(func() {
        ipcClient.Close()
        backend.StopServer()
    })
    
    myWindow.SetContent(content)
    myWindow.ShowAndRun()
}
```

## Gerenciamento Avançado de Processos

### Monitor de Processo

```go
type ProcessMonitor struct {
    backend    *BackendManager
    apiClient  *APIClient
    statusChan chan string
    errorChan  chan error
    stopChan   chan bool
    isRunning  bool
}

func NewProcessMonitor(backend *BackendManager) *ProcessMonitor {
    return &ProcessMonitor{
        backend:    backend,
        statusChan: make(chan string, 10),
        errorChan:  make(chan error, 10),
        stopChan:   make(chan bool, 1),
    }
}

func (pm *ProcessMonitor) Start() {
    if pm.isRunning {
        return
    }
    
    pm.isRunning = true
    go pm.monitorLoop()
}

func (pm *ProcessMonitor) Stop() {
    if !pm.isRunning {
        return
    }
    
    pm.stopChan <- true
    pm.isRunning = false
}

func (pm *ProcessMonitor) monitorLoop() {
    ticker := time.NewTicker(5 * time.Second)
    defer ticker.Stop()
    
    for {
        select {
        case <-pm.stopChan:
            return
        case <-ticker.C:
            if pm.backend.IsRunning() {
                if pm.apiClient == nil {
                    pm.apiClient = NewAPIClient(8080)
                }
                
                err := pm.apiClient.HealthCheck()
                if err != nil {
                    pm.errorChan <- fmt.Errorf("health check falhou: %v", err)
                    pm.statusChan <- "unhealthy"
                } else {
                    pm.statusChan <- "healthy"
                }
            } else {
                pm.statusChan <- "stopped"
                pm.apiClient = nil
            }
        }
    }
}

func (pm *ProcessMonitor) StatusChannel() <-chan string {
    return pm.statusChan
}

func (pm *ProcessMonitor) ErrorChannel() <-chan error {
    return pm.errorChan
}
```

## Próximos Passos

Continue para [Configuração](../configuracao/index.md) onde aprenderá como salvar e gerenciar configurações da aplicação.

---

**💡 Dica**: A comunicação com back-ends embutidos é uma técnica poderosa para criar aplicações distribuídas que funcionam como uma única aplicação para o usuário final!