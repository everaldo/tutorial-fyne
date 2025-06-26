# Requisições HTTP e Integração com APIs

Esta seção demonstra como integrar aplicações Fyne com APIs REST e serviços web, criando interfaces modernas que consomem dados externos.

## Visão Geral

Aplicações Fyne podem facilmente consumir APIs REST usando o pacote `net/http` padrão do Go, permitindo:

- Consumo de APIs REST
- Autenticação via tokens
- Upload e download de arquivos
- Integração com serviços de terceiros
- Cache local de dados
- Sincronização online/offline

## Cliente HTTP Básico

### Estrutura do Cliente
```go
package main

import (
    "bytes"
    "context"
    "encoding/json"
    "fmt"
    "io/ioutil"
    "net/http"
    "time"
)

type HTTPClient struct {
    client  *http.Client
    baseURL string
    token   string
    headers map[string]string
}

func NewHTTPClient(baseURL string) *HTTPClient {
    return &HTTPClient{
        client: &http.Client{
            Timeout: 30 * time.Second,
        },
        baseURL: baseURL,
        headers: make(map[string]string),
    }
}

func (c *HTTPClient) SetAuthToken(token string) {
    c.token = token
}

func (c *HTTPClient) SetHeader(key, value string) {
    c.headers[key] = value
}

func (c *HTTPClient) doRequest(method, endpoint string, body interface{}) (*http.Response, error) {
    var reqBody []byte
    var err error
    
    if body != nil {
        reqBody, err = json.Marshal(body)
        if err != nil {
            return nil, fmt.Errorf("erro ao serializar body: %v", err)
        }
    }
    
    req, err := http.NewRequest(method, c.baseURL+endpoint, bytes.NewBuffer(reqBody))
    if err != nil {
        return nil, fmt.Errorf("erro ao criar requisição: %v", err)
    }
    
    // Headers padrão
    req.Header.Set("Content-Type", "application/json")
    req.Header.Set("Accept", "application/json")
    
    // Token de autenticação
    if c.token != "" {
        req.Header.Set("Authorization", "Bearer "+c.token)
    }
    
    // Headers customizados
    for key, value := range c.headers {
        req.Header.Set(key, value)
    }
    
    return c.client.Do(req)
}

func (c *HTTPClient) Get(endpoint string) (*http.Response, error) {
    return c.doRequest("GET", endpoint, nil)
}

func (c *HTTPClient) Post(endpoint string, body interface{}) (*http.Response, error) {
    return c.doRequest("POST", endpoint, body)
}

func (c *HTTPClient) Put(endpoint string, body interface{}) (*http.Response, error) {
    return c.doRequest("PUT", endpoint, body)
}

func (c *HTTPClient) Delete(endpoint string) (*http.Response, error) {
    return c.doRequest("DELETE", endpoint, nil)
}
```

## Exemplo Prático: Cliente de API REST

### Modelos de Dados
```go
package main

import (
    "time"
)

type User struct {
    ID        int       `json:"id"`
    Name      string    `json:"name"`
    Email     string    `json:"email"`
    Username  string    `json:"username"`
    Phone     string    `json:"phone"`
    Website   string    `json:"website"`
    CreatedAt time.Time `json:"created_at"`
    UpdatedAt time.Time `json:"updated_at"`
}

type Post struct {
    ID     int    `json:"id"`
    UserID int    `json:"userId"`
    Title  string `json:"title"`
    Body   string `json:"body"`
}

type Comment struct {
    ID     int    `json:"id"`
    PostID int    `json:"postId"`
    Name   string `json:"name"`
    Email  string `json:"email"`
    Body   string `json:"body"`
}

type APIResponse struct {
    Data    interface{} `json:"data"`
    Message string      `json:"message"`
    Status  string      `json:"status"`
    Error   string      `json:"error,omitempty"`
}
```

### Serviço de API
```go
package main

import (
    "encoding/json"
    "fmt"
    "io/ioutil"
)

type APIService struct {
    client *HTTPClient
}

func NewAPIService(baseURL string) *APIService {
    return &APIService{
        client: NewHTTPClient(baseURL),
    }
}

func (s *APIService) SetAuthToken(token string) {
    s.client.SetAuthToken(token)
}

// Usuários
func (s *APIService) GetUsers() ([]User, error) {
    resp, err := s.client.Get("/users")
    if err != nil {
        return nil, err
    }
    defer resp.Body.Close()
    
    body, err := ioutil.ReadAll(resp.Body)
    if err != nil {
        return nil, err
    }
    
    if resp.StatusCode != 200 {
        return nil, fmt.Errorf("erro da API: %d - %s", resp.StatusCode, string(body))
    }
    
    var users []User
    err = json.Unmarshal(body, &users)
    return users, err
}

func (s *APIService) GetUser(id int) (*User, error) {
    resp, err := s.client.Get(fmt.Sprintf("/users/%d", id))
    if err != nil {
        return nil, err
    }
    defer resp.Body.Close()
    
    body, err := ioutil.ReadAll(resp.Body)
    if err != nil {
        return nil, err
    }
    
    if resp.StatusCode != 200 {
        return nil, fmt.Errorf("erro da API: %d - %s", resp.StatusCode, string(body))
    }
    
    var user User
    err = json.Unmarshal(body, &user)
    return &user, err
}

func (s *APIService) CreateUser(user User) (*User, error) {
    resp, err := s.client.Post("/users", user)
    if err != nil {
        return nil, err
    }
    defer resp.Body.Close()
    
    body, err := ioutil.ReadAll(resp.Body)
    if err != nil {
        return nil, err
    }
    
    if resp.StatusCode != 201 {
        return nil, fmt.Errorf("erro da API: %d - %s", resp.StatusCode, string(body))
    }
    
    var createdUser User
    err = json.Unmarshal(body, &createdUser)
    return &createdUser, err
}

func (s *APIService) UpdateUser(id int, user User) (*User, error) {
    resp, err := s.client.Put(fmt.Sprintf("/users/%d", id), user)
    if err != nil {
        return nil, err
    }
    defer resp.Body.Close()
    
    body, err := ioutil.ReadAll(resp.Body)
    if err != nil {
        return nil, err
    }
    
    if resp.StatusCode != 200 {
        return nil, fmt.Errorf("erro da API: %d - %s", resp.StatusCode, string(body))
    }
    
    var updatedUser User
    err = json.Unmarshal(body, &updatedUser)
    return &updatedUser, err
}

func (s *APIService) DeleteUser(id int) error {
    resp, err := s.client.Delete(fmt.Sprintf("/users/%d", id))
    if err != nil {
        return err
    }
    defer resp.Body.Close()
    
    if resp.StatusCode != 204 && resp.StatusCode != 200 {
        body, _ := ioutil.ReadAll(resp.Body)
        return fmt.Errorf("erro da API: %d - %s", resp.StatusCode, string(body))
    }
    
    return nil
}

// Posts
func (s *APIService) GetPosts() ([]Post, error) {
    resp, err := s.client.Get("/posts")
    if err != nil {
        return nil, err
    }
    defer resp.Body.Close()
    
    body, err := ioutil.ReadAll(resp.Body)
    if err != nil {
        return nil, err
    }
    
    if resp.StatusCode != 200 {
        return nil, fmt.Errorf("erro da API: %d - %s", resp.StatusCode, string(body))
    }
    
    var posts []Post
    err = json.Unmarshal(body, &posts)
    return posts, err
}

func (s *APIService) GetUserPosts(userID int) ([]Post, error) {
    resp, err := s.client.Get(fmt.Sprintf("/users/%d/posts", userID))
    if err != nil {
        return nil, err
    }
    defer resp.Body.Close()
    
    body, err := ioutil.ReadAll(resp.Body)
    if err != nil {
        return nil, err
    }
    
    if resp.StatusCode != 200 {
        return nil, fmt.Errorf("erro da API: %d - %s", resp.StatusCode, string(body))
    }
    
    var posts []Post
    err = json.Unmarshal(body, &posts)
    return posts, err
}
```

## Interface Fyne com API

### Aplicação Principal
```go
package main

import (
    "fmt"
    "log"
    "strconv"
    
    "fyne.io/fyne/v2/app"
    "fyne.io/fyne/v2/container"
    "fyne.io/fyne/v2/dialog"
    "fyne.io/fyne/v2/widget"
)

type APIApp struct {
    app         fyne.App
    window      fyne.Window
    apiService  *APIService
    
    // Widgets
    usersList    *widget.List
    userForm     *widget.Form
    postsList    *widget.List
    statusLabel  *widget.Label
    loadingBar   *widget.ProgressBarInfinite
    
    // Dados
    users        []User
    selectedUser *User
    posts        []Post
}

func NewAPIApp() *APIApp {
    myApp := app.NewWithID("com.exemplo.apiapp")
    
    apiApp := &APIApp{
        app:        myApp,
        window:     myApp.NewWindow("API Client - Fyne"),
        apiService: NewAPIService("https://jsonplaceholder.typicode.com"),
    }
    
    apiApp.setupUI()
    return apiApp
}

func (a *APIApp) setupUI() {
    a.window.Resize(fyne.NewSize(1000, 700))
    
    // Status e loading
    a.statusLabel = widget.NewLabel("Pronto")
    a.loadingBar = widget.NewProgressBarInfinite()
    a.loadingBar.Hide()
    
    // Lista de usuários
    a.usersList = widget.NewList(
        func() int { return len(a.users) },
        func() fyne.CanvasObject {
            return container.NewHBox(
                widget.NewLabel("Nome"),
                widget.NewLabel("Email"),
            )
        },
        func(i widget.ListItemID, o fyne.CanvasObject) {
            if i < len(a.users) {
                user := a.users[i]
                container := o.(*container.Container)
                nameLabel := container.Objects[0].(*widget.Label)
                emailLabel := container.Objects[1].(*widget.Label)
                
                nameLabel.SetText(user.Name)
                emailLabel.SetText(user.Email)
            }
        },
    )
    
    a.usersList.OnSelected = func(id widget.ListItemID) {
        if id < len(a.users) {
            a.selectedUser = &a.users[id]
            a.loadUserPosts(a.selectedUser.ID)
            a.updateUserForm()
        }
    }
    
    // Formulário de usuário
    a.createUserForm()
    
    // Lista de posts
    a.postsList = widget.NewList(
        func() int { return len(a.posts) },
        func() fyne.CanvasObject {
            return container.NewVBox(
                widget.NewLabel("Título"),
                widget.NewLabel("Conteúdo"),
            )
        },
        func(i widget.ListItemID, o fyne.CanvasObject) {
            if i < len(a.posts) {
                post := a.posts[i]
                container := o.(*container.Container)
                titleLabel := container.Objects[0].(*widget.Label)
                bodyLabel := container.Objects[1].(*widget.Label)
                
                titleLabel.SetText(post.Title)
                bodyLabel.SetText(post.Body[:min(len(post.Body), 100)] + "...")
            }
        },
    )
    
    // Botões de ação
    loadUsersBtn := widget.NewButton("Carregar Usuários", func() {
        a.loadUsers()
    })
    
    addUserBtn := widget.NewButton("Novo Usuário", func() {
        a.showAddUserDialog()
    })
    
    deleteUserBtn := widget.NewButton("Deletar Usuário", func() {
        if a.selectedUser != nil {
            a.deleteUser(a.selectedUser.ID)
        }
    })
    
    // Layout
    leftPanel := container.NewVBox(
        widget.NewCard("Ações", "", container.NewVBox(
            loadUsersBtn,
            addUserBtn,
            deleteUserBtn,
        )),
        widget.NewCard("Usuários", "", a.usersList),
    )
    
    centerPanel := container.NewVBox(
        widget.NewCard("Detalhes do Usuário", "", a.userForm),
    )
    
    rightPanel := container.NewVBox(
        widget.NewCard("Posts do Usuário", "", a.postsList),
    )
    
    mainContent := container.NewHSplit(
        leftPanel,
        container.NewHSplit(centerPanel, rightPanel),
    )
    mainContent.SetOffset(0.3)
    
    statusBar := container.NewHBox(
        a.statusLabel,
        a.loadingBar,
    )
    
    content := container.NewBorder(
        nil,         // top
        statusBar,   // bottom
        nil,         // left
        nil,         // right
        mainContent, // center
    )
    
    a.window.SetContent(content)
}

func (a *APIApp) createUserForm() {
    nameEntry := widget.NewEntry()
    emailEntry := widget.NewEntry()
    usernameEntry := widget.NewEntry()
    phoneEntry := widget.NewEntry()
    websiteEntry := widget.NewEntry()
    
    a.userForm = &widget.Form{
        Items: []*widget.FormItem{
            {Text: "Nome", Widget: nameEntry},
            {Text: "Email", Widget: emailEntry},
            {Text: "Username", Widget: usernameEntry},
            {Text: "Telefone", Widget: phoneEntry},
            {Text: "Website", Widget: websiteEntry},
        },
        OnSubmit: func() {
            if a.selectedUser != nil {
                a.updateUser()
            }
        },
        OnCancel: func() {
            a.clearUserForm()
        },
    }
}

func (a *APIApp) updateUserForm() {
    if a.selectedUser == nil {
        return
    }
    
    items := a.userForm.Items
    items[0].Widget.(*widget.Entry).SetText(a.selectedUser.Name)
    items[1].Widget.(*widget.Entry).SetText(a.selectedUser.Email)
    items[2].Widget.(*widget.Entry).SetText(a.selectedUser.Username)
    items[3].Widget.(*widget.Entry).SetText(a.selectedUser.Phone)
    items[4].Widget.(*widget.Entry).SetText(a.selectedUser.Website)
}

func (a *APIApp) clearUserForm() {
    for _, item := range a.userForm.Items {
        item.Widget.(*widget.Entry).SetText("")
    }
    a.selectedUser = nil
}

func (a *APIApp) showLoading(message string) {
    a.statusLabel.SetText(message)
    a.loadingBar.Show()
    a.loadingBar.Start()
}

func (a *APIApp) hideLoading() {
    a.loadingBar.Stop()
    a.loadingBar.Hide()
    a.statusLabel.SetText("Pronto")
}

func (a *APIApp) loadUsers() {
    a.showLoading("Carregando usuários...")
    
    go func() {
        users, err := a.apiService.GetUsers()
        if err != nil {
            a.hideLoading()
            dialog.ShowError(err, a.window)
            return
        }
        
        a.users = users
        a.usersList.Refresh()
        a.hideLoading()
        a.statusLabel.SetText(fmt.Sprintf("Carregados %d usuários", len(users)))
    }()
}

func (a *APIApp) loadUserPosts(userID int) {
    go func() {
        posts, err := a.apiService.GetUserPosts(userID)
        if err != nil {
            log.Printf("Erro ao carregar posts: %v", err)
            return
        }
        
        a.posts = posts
        a.postsList.Refresh()
    }()
}

func (a *APIApp) updateUser() {
    if a.selectedUser == nil {
        return
    }
    
    items := a.userForm.Items
    updatedUser := User{
        ID:       a.selectedUser.ID,
        Name:     items[0].Widget.(*widget.Entry).Text,
        Email:    items[1].Widget.(*widget.Entry).Text,
        Username: items[2].Widget.(*widget.Entry).Text,
        Phone:    items[3].Widget.(*widget.Entry).Text,
        Website:  items[4].Widget.(*widget.Entry).Text,
    }
    
    a.showLoading("Atualizando usuário...")
    
    go func() {
        _, err := a.apiService.UpdateUser(a.selectedUser.ID, updatedUser)
        if err != nil {
            a.hideLoading()
            dialog.ShowError(err, a.window)
            return
        }
        
        // Atualizar na lista local
        for i, user := range a.users {
            if user.ID == a.selectedUser.ID {
                a.users[i] = updatedUser
                break
            }
        }
        
        a.selectedUser = &updatedUser
        a.usersList.Refresh()
        a.hideLoading()
        a.statusLabel.SetText("Usuário atualizado com sucesso!")
    }()
}

func (a *APIApp) deleteUser(userID int) {
    dialog.ShowConfirm("Confirmar", "Deseja realmente deletar este usuário?", 
        func(confirmed bool) {
            if !confirmed {
                return
            }
            
            a.showLoading("Deletando usuário...")
            
            go func() {
                err := a.apiService.DeleteUser(userID)
                if err != nil {
                    a.hideLoading()
                    dialog.ShowError(err, a.window)
                    return
                }
                
                // Remover da lista local
                for i, user := range a.users {
                    if user.ID == userID {
                        a.users = append(a.users[:i], a.users[i+1:]...)
                        break
                    }
                }
                
                a.clearUserForm()
                a.posts = []Post{}
                a.usersList.Refresh()
                a.postsList.Refresh()
                a.hideLoading()
                a.statusLabel.SetText("Usuário deletado com sucesso!")
            }()
        }, a.window)
}

func (a *APIApp) showAddUserDialog() {
    nameEntry := widget.NewEntry()
    emailEntry := widget.NewEntry()
    usernameEntry := widget.NewEntry()
    phoneEntry := widget.NewEntry()
    websiteEntry := widget.NewEntry()
    
    form := &widget.Form{
        Items: []*widget.FormItem{
            {Text: "Nome", Widget: nameEntry},
            {Text: "Email", Widget: emailEntry},
            {Text: "Username", Widget: usernameEntry},
            {Text: "Telefone", Widget: phoneEntry},
            {Text: "Website", Widget: websiteEntry},
        },
    }
    
    dialog.ShowForm("Novo Usuário", "Criar", "Cancelar", form.Items, 
        func(confirmed bool) {
            if !confirmed {
                return
            }
            
            newUser := User{
                Name:     nameEntry.Text,
                Email:    emailEntry.Text,
                Username: usernameEntry.Text,
                Phone:    phoneEntry.Text,
                Website:  websiteEntry.Text,
            }
            
            a.createUser(newUser)
        }, a.window)
}

func (a *APIApp) createUser(user User) {
    a.showLoading("Criando usuário...")
    
    go func() {
        createdUser, err := a.apiService.CreateUser(user)
        if err != nil {
            a.hideLoading()
            dialog.ShowError(err, a.window)
            return
        }
        
        a.users = append(a.users, *createdUser)
        a.usersList.Refresh()
        a.hideLoading()
        a.statusLabel.SetText("Usuário criado com sucesso!")
    }()
}

func (a *APIApp) Run() {
    a.window.ShowAndRun()
}

func min(a, b int) int {
    if a < b {
        return a
    }
    return b
}

func main() {
    app := NewAPIApp()
    app.Run()
}
```

## Autenticação e Segurança

### JWT Authentication
```go
package main

import (
    "encoding/json"
    "fmt"
    "time"
)

type AuthService struct {
    client *HTTPClient
    token  string
    expiry time.Time
}

type LoginRequest struct {
    Username string `json:"username"`
    Password string `json:"password"`
}

type LoginResponse struct {
    Token     string    `json:"token"`
    ExpiresAt time.Time `json:"expires_at"`
    User      User      `json:"user"`
}

func NewAuthService(baseURL string) *AuthService {
    return &AuthService{
        client: NewHTTPClient(baseURL),
    }
}

func (a *AuthService) Login(username, password string) (*LoginResponse, error) {
    req := LoginRequest{
        Username: username,
        Password: password,
    }
    
    resp, err := a.client.Post("/auth/login", req)
    if err != nil {
        return nil, err
    }
    defer resp.Body.Close()
    
    if resp.StatusCode != 200 {
        return nil, fmt.Errorf("login falhou: status %d", resp.StatusCode)
    }
    
    var loginResp LoginResponse
    err = json.NewDecoder(resp.Body).Decode(&loginResp)
    if err != nil {
        return nil, err
    }
    
    // Salvar token
    a.token = loginResp.Token
    a.expiry = loginResp.ExpiresAt
    a.client.SetAuthToken(a.token)
    
    return &loginResp, nil
}

func (a *AuthService) IsAuthenticated() bool {
    return a.token != "" && time.Now().Before(a.expiry)
}

func (a *AuthService) RefreshToken() error {
    if a.token == "" {
        return fmt.Errorf("nenhum token para refresh")
    }
    
    resp, err := a.client.Post("/auth/refresh", nil)
    if err != nil {
        return err
    }
    defer resp.Body.Close()
    
    var refreshResp LoginResponse
    err = json.NewDecoder(resp.Body).Decode(&refreshResp)
    if err != nil {
        return err
    }
    
    a.token = refreshResp.Token
    a.expiry = refreshResp.ExpiresAt
    a.client.SetAuthToken(a.token)
    
    return nil
}

func (a *AuthService) Logout() {
    a.token = ""
    a.expiry = time.Time{}
    a.client.SetAuthToken("")
}
```

### Interface de Login
```go
func (a *APIApp) showLoginDialog() {
    usernameEntry := widget.NewEntry()
    usernameEntry.SetPlaceHolder("Username")
    
    passwordEntry := widget.NewPasswordEntry()
    passwordEntry.SetPlaceHolder("Password")
    
    form := &widget.Form{
        Items: []*widget.FormItem{
            {Text: "Username", Widget: usernameEntry},
            {Text: "Password", Widget: passwordEntry},
        },
    }
    
    dialog.ShowForm("Login", "Entrar", "Cancelar", form.Items,
        func(confirmed bool) {
            if !confirmed {
                return
            }
            
            a.performLogin(usernameEntry.Text, passwordEntry.Text)
        }, a.window)
}

func (a *APIApp) performLogin(username, password string) {
    a.showLoading("Fazendo login...")
    
    go func() {
        authService := NewAuthService("https://api.exemplo.com")
        
        loginResp, err := authService.Login(username, password)
        if err != nil {
            a.hideLoading()
            dialog.ShowError(err, a.window)
            return
        }
        
        // Configurar token no cliente API
        a.apiService.SetAuthToken(loginResp.Token)
        
        a.hideLoading()
        a.statusLabel.SetText(fmt.Sprintf("Bem-vindo, %s!", loginResp.User.Name))
        
        // Carregar dados do usuário
        a.loadUsers()
    }()
}
```

## Upload e Download de Arquivos

### Upload de Arquivos
```go
func (c *HTTPClient) UploadFile(endpoint, filePath string) (*http.Response, error) {
    file, err := os.Open(filePath)
    if err != nil {
        return nil, err
    }
    defer file.Close()
    
    body := &bytes.Buffer{}
    writer := multipart.NewWriter(body)
    
    part, err := writer.CreateFormFile("file", filepath.Base(filePath))
    if err != nil {
        return nil, err
    }
    
    _, err = io.Copy(part, file)
    if err != nil {
        return nil, err
    }
    
    err = writer.Close()
    if err != nil {
        return nil, err
    }
    
    req, err := http.NewRequest("POST", c.baseURL+endpoint, body)
    if err != nil {
        return nil, err
    }
    
    req.Header.Set("Content-Type", writer.FormDataContentType())
    
    if c.token != "" {
        req.Header.Set("Authorization", "Bearer "+c.token)
    }
    
    return c.client.Do(req)
}

func (a *APIApp) uploadFile() {
    dialog.ShowFileOpen(func(reader fyne.URIReadCloser) {
        if reader == nil {
            return
        }
        defer reader.Close()
        
        a.showLoading("Fazendo upload...")
        
        go func() {
            resp, err := a.apiService.client.UploadFile("/upload", reader.URI().Path())
            if err != nil {
                a.hideLoading()
                dialog.ShowError(err, a.window)
                return
            }
            defer resp.Body.Close()
            
            if resp.StatusCode != 200 {
                a.hideLoading()
                dialog.ShowError(fmt.Errorf("erro no upload: %d", resp.StatusCode), a.window)
                return
            }
            
            a.hideLoading()
            a.statusLabel.SetText("Upload concluído com sucesso!")
        }()
    }, a.window)
}
```

### Download de Arquivos
```go
func (c *HTTPClient) DownloadFile(endpoint, savePath string) error {
    resp, err := c.Get(endpoint)
    if err != nil {
        return err
    }
    defer resp.Body.Close()
    
    if resp.StatusCode != 200 {
        return fmt.Errorf("erro no download: %d", resp.StatusCode)
    }
    
    file, err := os.Create(savePath)
    if err != nil {
        return err
    }
    defer file.Close()
    
    _, err = io.Copy(file, resp.Body)
    return err
}

func (a *APIApp) downloadFile(fileID string) {
    dialog.ShowFolderOpen(func(folder fyne.ListableURI) {
        if folder == nil {
            return
        }
        
        savePath := filepath.Join(folder.Path(), fmt.Sprintf("file_%s.dat", fileID))
        
        a.showLoading("Fazendo download...")
        
        go func() {
            err := a.apiService.client.DownloadFile(fmt.Sprintf("/files/%s", fileID), savePath)
            if err != nil {
                a.hideLoading()
                dialog.ShowError(err, a.window)
                return
            }
            
            a.hideLoading()
            a.statusLabel.SetText("Download concluído!")
        }()
    }, a.window)
}
```

## Cache e Persistência Local

### Sistema de Cache
```go
package main

import (
    "encoding/json"
    "fmt"
    "os"
    "path/filepath"
    "time"
)

type CacheManager struct {
    cacheDir string
    ttl      time.Duration
}

type CacheEntry struct {
    Data      interface{} `json:"data"`
    Timestamp time.Time   `json:"timestamp"`
    TTL       time.Duration `json:"ttl"`
}

func NewCacheManager(cacheDir string, ttl time.Duration) *CacheManager {
    os.MkdirAll(cacheDir, 0755)
    return &CacheManager{
        cacheDir: cacheDir,
        ttl:      ttl,
    }
}

func (c *CacheManager) Set(key string, data interface{}) error {
    entry := CacheEntry{
        Data:      data,
        Timestamp: time.Now(),
        TTL:       c.ttl,
    }
    
    jsonData, err := json.Marshal(entry)
    if err != nil {
        return err
    }
    
    filePath := filepath.Join(c.cacheDir, key+".json")
    return os.WriteFile(filePath, jsonData, 0644)
}

func (c *CacheManager) Get(key string, target interface{}) error {
    filePath := filepath.Join(c.cacheDir, key+".json")
    
    data, err := os.ReadFile(filePath)
    if err != nil {
        return err
    }
    
    var entry CacheEntry
    err = json.Unmarshal(data, &entry)
    if err != nil {
        return err
    }
    
    // Verificar TTL
    if time.Since(entry.Timestamp) > entry.TTL {
        os.Remove(filePath)
        return fmt.Errorf("cache expirado")
    }
    
    // Deserializar dados
    dataBytes, err := json.Marshal(entry.Data)
    if err != nil {
        return err
    }
    
    return json.Unmarshal(dataBytes, target)
}

func (c *CacheManager) Clear() error {
    return os.RemoveAll(c.cacheDir)
}
```

### API com Cache
```go
func (s *APIService) GetUsersWithCache() ([]User, error) {
    // Tentar cache primeiro
    var cachedUsers []User
    err := s.cache.Get("users", &cachedUsers)
    if err == nil {
        return cachedUsers, nil
    }
    
    // Buscar da API
    users, err := s.GetUsers()
    if err != nil {
        return nil, err
    }
    
    // Salvar no cache
    s.cache.Set("users", users)
    
    return users, nil
}
```

## Próximos Passos

Continue para [Mídia](../midia/index.md) onde aprenderá como integrar reprodução de áudio e vídeo em aplicações Fyne.

---

**💡 Dica**: Sempre implemente timeout e tratamento de erro adequado para requisições HTTP, especialmente em aplicações GUI que precisam manter a responsividade!