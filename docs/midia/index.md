# Execução de Mídia (Áudio e Vídeo)

Esta seção demonstra como integrar reprodução de mídia em aplicações Fyne usando a biblioteca Fyne-Streamer baseada em GStreamer.

## Visão Geral

O Fyne não possui suporte nativo para reprodução de mídia, mas a biblioteca **Fyne-Streamer** oferece widgets poderosos para:

- Reprodução de vídeo com controles
- Visualização de vídeo sem controles
- Manipulação de áudio
- Streaming de mídia via HTTP/HTTPS
- Efeitos e filtros de vídeo
- Captura de câmera

### Características do Fyne-Streamer
- Baseado em GStreamer (framework multiplataforma)
- Suporte a múltiplos formatos (MP4, AVI, MOV, MP3, WAV, etc.)
- Controles de reprodução integrados
- Streaming em tempo real
- Efeitos visuais e filtros

## Pré-requisitos

### Instalação do GStreamer

#### Linux (Ubuntu/Debian)
```bash
sudo apt-get install \
    libgstreamer1.0-dev \
    libgstreamer-plugins-base1.0-dev \
    gstreamer1.0-plugins-good \
    gstreamer1.0-plugins-bad \
    gstreamer1.0-plugins-ugly \
    gstreamer1.0-libav
```

#### Linux (CentOS/RHEL/Fedora)
```bash
sudo yum install \
    gstreamer1-devel \
    gstreamer1-plugins-base-devel \
    gstreamer1-plugins-good \
    gstreamer1-plugins-bad-free \
    gstreamer1-plugins-ugly-free
```

#### macOS
```bash
brew install gstreamer gst-plugins-base gst-plugins-good gst-plugins-bad gst-plugins-ugly
```

#### Windows
1. Baixar GStreamer do site oficial
2. Instalar versão de desenvolvimento
3. Usar MinGW versão <= 11 para compilação

### Instalação do Fyne-Streamer
```bash
go get github.com/metal3d/fyne-streamer
```

## Player de Vídeo Básico

### Visualizador Simples
```go
package main

import (
    "fyne.io/fyne/v2/app"
    "fyne.io/fyne/v2/container"
    "fyne.io/fyne/v2/dialog"
    "fyne.io/fyne/v2/storage"
    "fyne.io/fyne/v2/widget"
    "github.com/metal3d/fyne-streamer/video"
)

func main() {
    myApp := app.New()
    myWindow := myApp.NewWindow("Player de Vídeo Simples")
    myWindow.Resize(fyne.NewSize(800, 600))

    // Criar visualizador de vídeo
    viewer := video.NewViewer()
    
    // Botão para abrir arquivo
    openBtn := widget.NewButton("Abrir Vídeo", func() {
        dialog.ShowFileOpen(func(reader fyne.URIReadCloser) {
            if reader == nil {
                return
            }
            defer reader.Close()
            
            // Abrir o arquivo no player
            viewer.Open(reader.URI())
            viewer.Play()
        }, myWindow)
    })
    
    // Controles básicos
    playBtn := widget.NewButton("Play", func() {
        viewer.Play()
    })
    
    pauseBtn := widget.NewButton("Pause", func() {
        viewer.Pause()
    })
    
    stopBtn := widget.NewButton("Stop", func() {
        viewer.Stop()
    })
    
    controls := container.NewHBox(openBtn, playBtn, pauseBtn, stopBtn)
    
    content := container.NewBorder(
        controls, // top
        nil,      // bottom
        nil,      // left
        nil,      // right
        viewer,   // center
    )
    
    myWindow.SetContent(content)
    myWindow.ShowAndRun()
}
```

### Player Completo com Controles
```go
package main

import (
    "fmt"
    "time"
    
    "fyne.io/fyne/v2/app"
    "fyne.io/fyne/v2/container"
    "fyne.io/fyne/v2/dialog"
    "fyne.io/fyne/v2/widget"
    "github.com/metal3d/fyne-streamer/video"
)

type MediaPlayer struct {
    app    fyne.App
    window fyne.Window
    player *video.Player
    
    // Controles
    positionSlider *widget.Slider
    volumeSlider   *widget.Slider
    timeLabel      *widget.Label
    statusLabel    *widget.Label
    
    // Estado
    duration    time.Duration
    isPlaying   bool
    currentFile string
}

func NewMediaPlayer() *MediaPlayer {
    myApp := app.New()
    
    mp := &MediaPlayer{
        app:    myApp,
        window: myApp.NewWindow("Media Player - Fyne"),
    }
    
    mp.setupUI()
    return mp
}

func (mp *MediaPlayer) setupUI() {
    mp.window.Resize(fyne.NewSize(900, 650))
    
    // Player de vídeo com controles integrados
    mp.player = video.NewPlayer()
    
    // Configurar callbacks do player
    mp.player.OnPositionChanged = func(position time.Duration) {
        if mp.duration > 0 {
            progress := float64(position) / float64(mp.duration)
            mp.positionSlider.SetValue(progress * 100)
            mp.updateTimeLabel(position)
        }
    }
    
    mp.player.OnDurationChanged = func(duration time.Duration) {
        mp.duration = duration
        mp.updateTimeLabel(0)
    }
    
    mp.player.OnStateChanged = func(state video.State) {
        switch state {
        case video.StatePlaying:
            mp.isPlaying = true
            mp.statusLabel.SetText("Reproduzindo")
        case video.StatePaused:
            mp.isPlaying = false
            mp.statusLabel.SetText("Pausado")
        case video.StateStopped:
            mp.isPlaying = false
            mp.statusLabel.SetText("Parado")
            mp.positionSlider.SetValue(0)
        }
    }
    
    // Controles customizados
    mp.createControls()
    
    // Layout principal
    content := container.NewBorder(
        mp.createMenuBar(),        // top
        mp.createControlsPanel(),  // bottom
        nil,                      // left
        nil,                      // right
        mp.player,                // center
    )
    
    mp.window.SetContent(content)
}

func (mp *MediaPlayer) createMenuBar() *fyne.Container {
    openBtn := widget.NewButton("Abrir Arquivo", func() {
        mp.openFile()
    })
    
    openURLBtn := widget.NewButton("Abrir URL", func() {
        mp.openURL()
    })
    
    fullscreenBtn := widget.NewButton("Tela Cheia", func() {
        mp.toggleFullscreen()
    })
    
    return container.NewHBox(openBtn, openURLBtn, fullscreenBtn)
}

func (mp *MediaPlayer) createControls() {
    // Slider de posição
    mp.positionSlider = widget.NewSlider(0, 100)
    mp.positionSlider.OnChangeEnded = func(value float64) {
        if mp.duration > 0 {
            newPosition := time.Duration(float64(mp.duration) * value / 100)
            mp.player.Seek(newPosition)
        }
    }
    
    // Slider de volume
    mp.volumeSlider = widget.NewSlider(0, 1)
    mp.volumeSlider.SetValue(1.0)
    mp.volumeSlider.OnChanged = func(value float64) {
        mp.player.SetVolume(value)
    }
    
    // Labels de tempo e status
    mp.timeLabel = widget.NewLabel("00:00 / 00:00")
    mp.statusLabel = widget.NewLabel("Pronto")
}

func (mp *MediaPlayer) createControlsPanel() *fyne.Container {
    // Botões de controle
    playPauseBtn := widget.NewButton("▶", func() {
        if mp.isPlaying {
            mp.player.Pause()
        } else {
            mp.player.Play()
        }
    })
    
    stopBtn := widget.NewButton("⏹", func() {
        mp.player.Stop()
    })
    
    previousBtn := widget.NewButton("⏮", func() {
        mp.player.Seek(0)
    })
    
    nextBtn := widget.NewButton("⏭", func() {
        // Implementar playlist se necessário
    })
    
    // Controles de volume
    volumeLabel := widget.NewLabel("🔊")
    volumeContainer := container.NewHBox(volumeLabel, mp.volumeSlider)
    
    // Painel de posição
    positionContainer := container.NewVBox(
        mp.positionSlider,
        mp.timeLabel,
    )
    
    // Layout dos controles
    playControls := container.NewHBox(
        previousBtn,
        playPauseBtn,
        stopBtn,
        nextBtn,
    )
    
    leftPanel := container.NewVBox(
        playControls,
        mp.statusLabel,
    )
    
    rightPanel := container.NewVBox(
        volumeContainer,
    )
    
    return container.NewBorder(
        positionContainer, // top
        nil,              // bottom
        leftPanel,        // left
        rightPanel,       // right
        nil,              // center
    )
}

func (mp *MediaPlayer) openFile() {
    dialog.ShowFileOpen(func(reader fyne.URIReadCloser) {
        if reader == nil {
            return
        }
        defer reader.Close()
        
        mp.currentFile = reader.URI().Path()
        mp.loadMedia(reader.URI())
    }, mp.window)
}

func (mp *MediaPlayer) openURL() {
    entry := widget.NewEntry()
    entry.SetPlaceHolder("Digite a URL do vídeo...")
    
    dialog.ShowForm("Abrir URL", "Abrir", "Cancelar", 
        []*widget.FormItem{
            {Text: "URL", Widget: entry},
        }, func(confirmed bool) {
            if confirmed && entry.Text != "" {
                uri := storage.NewURI(entry.Text)
                mp.loadMedia(uri)
            }
        }, mp.window)
}

func (mp *MediaPlayer) loadMedia(uri fyne.URI) {
    mp.statusLabel.SetText("Carregando...")
    
    // Carregar mídia no player
    mp.player.Open(uri)
    
    // Opcional: começar a reproduzir automaticamente
    go func() {
        time.Sleep(500 * time.Millisecond)
        mp.player.Play()
    }()
    
    mp.statusLabel.SetText(fmt.Sprintf("Carregado: %s", uri.Name()))
}

func (mp *MediaPlayer) updateTimeLabel(position time.Duration) {
    posStr := mp.formatDuration(position)
    durStr := mp.formatDuration(mp.duration)
    mp.timeLabel.SetText(fmt.Sprintf("%s / %s", posStr, durStr))
}

func (mp *MediaPlayer) formatDuration(d time.Duration) string {
    minutes := int(d.Minutes())
    seconds := int(d.Seconds()) % 60
    return fmt.Sprintf("%02d:%02d", minutes, seconds)
}

func (mp *MediaPlayer) toggleFullscreen() {
    mp.window.SetFullScreen(!mp.window.FullScreen())
}

func (mp *MediaPlayer) Run() {
    mp.window.ShowAndRun()
}

func main() {
    player := NewMediaPlayer()
    player.Run()
}
```

## Player de Áudio

### Player de Áudio Simples
```go
package main

import (
    "fmt"
    "time"
    
    "fyne.io/fyne/v2/app"
    "fyne.io/fyne/v2/container"
    "fyne.io/fyne/v2/dialog"
    "fyne.io/fyne/v2/widget"
    "github.com/metal3d/fyne-streamer/audio"
)

type AudioPlayer struct {
    app    fyne.App
    window fyne.Window
    player *audio.Player
    
    // Controles
    playBtn     *widget.Button
    stopBtn     *widget.Button
    volumeSlider *widget.Slider
    progressBar  *widget.ProgressBar
    
    // Estado
    isPlaying bool
    playlist  []string
    currentIndex int
}

func NewAudioPlayer() *AudioPlayer {
    myApp := app.New()
    
    ap := &AudioPlayer{
        app:     myApp,
        window:  myApp.NewWindow("Audio Player"),
        playlist: make([]string, 0),
    }
    
    ap.setupUI()
    return ap
}

func (ap *AudioPlayer) setupUI() {
    ap.window.Resize(fyne.NewSize(500, 300))
    
    // Criar player de áudio
    ap.player = audio.NewPlayer()
    
    // Configurar callbacks
    ap.player.OnPositionChanged = func(position time.Duration) {
        // Atualizar barra de progresso
    }
    
    ap.player.OnEnded = func() {
        ap.playNext()
    }
    
    // Criar controles
    ap.createControls()
    
    // Layout
    controlPanel := container.NewVBox(
        ap.createFileControls(),
        ap.createPlaybackControls(),
        ap.createVolumeControls(),
    )
    
    ap.window.SetContent(controlPanel)
}

func (ap *AudioPlayer) createFileControls() *fyne.Container {
    openBtn := widget.NewButton("Abrir Arquivo", func() {
        dialog.ShowFileOpen(func(reader fyne.URIReadCloser) {
            if reader == nil {
                return
            }
            defer reader.Close()
            
            ap.loadAudio(reader.URI().Path())
        }, ap.window)
    })
    
    return container.NewHBox(openBtn)
}

func (ap *AudioPlayer) createPlaybackControls() *fyne.Container {
    ap.playBtn = widget.NewButton("▶", func() {
        if ap.isPlaying {
            ap.player.Pause()
            ap.playBtn.SetText("▶")
            ap.isPlaying = false
        } else {
            ap.player.Play()
            ap.playBtn.SetText("⏸")
            ap.isPlaying = true
        }
    })
    
    ap.stopBtn = widget.NewButton("⏹", func() {
        ap.player.Stop()
        ap.playBtn.SetText("▶")
        ap.isPlaying = false
    })
    
    prevBtn := widget.NewButton("⏮", func() {
        ap.playPrevious()
    })
    
    nextBtn := widget.NewButton("⏭", func() {
        ap.playNext()
    })
    
    ap.progressBar = widget.NewProgressBar()
    
    return container.NewVBox(
        container.NewHBox(prevBtn, ap.playBtn, ap.stopBtn, nextBtn),
        ap.progressBar,
    )
}

func (ap *AudioPlayer) createVolumeControls() *fyne.Container {
    ap.volumeSlider = widget.NewSlider(0, 1)
    ap.volumeSlider.SetValue(1.0)
    ap.volumeSlider.OnChanged = func(value float64) {
        ap.player.SetVolume(value)
    }
    
    volumeLabel := widget.NewLabel("Volume:")
    
    return container.NewHBox(volumeLabel, ap.volumeSlider)
}

func (ap *AudioPlayer) createControls() {
    // Controles já criados nos métodos acima
}

func (ap *AudioPlayer) loadAudio(filePath string) {
    ap.playlist = []string{filePath}
    ap.currentIndex = 0
    
    ap.player.Open(storage.NewFileURI(filePath))
}

func (ap *AudioPlayer) playNext() {
    if len(ap.playlist) == 0 {
        return
    }
    
    ap.currentIndex++
    if ap.currentIndex >= len(ap.playlist) {
        ap.currentIndex = 0
    }
    
    ap.loadAudio(ap.playlist[ap.currentIndex])
    ap.player.Play()
}

func (ap *AudioPlayer) playPrevious() {
    if len(ap.playlist) == 0 {
        return
    }
    
    ap.currentIndex--
    if ap.currentIndex < 0 {
        ap.currentIndex = len(ap.playlist) - 1
    }
    
    ap.loadAudio(ap.playlist[ap.currentIndex])
    ap.player.Play()
}

func (ap *AudioPlayer) Run() {
    ap.window.ShowAndRun()
}

func main() {
    player := NewAudioPlayer()
    player.Run()
}
```

## Streaming de Mídia

### Player de Streaming
```go
package main

import (
    "fmt"
    
    "fyne.io/fyne/v2/app"
    "fyne.io/fyne/v2/container"
    "fyne.io/fyne/v2/dialog"
    "fyne.io/fyne/v2/storage"
    "fyne.io/fyne/v2/widget"
    "github.com/metal3d/fyne-streamer/video"
)

type StreamPlayer struct {
    app    fyne.App
    window fyne.Window
    player *video.Player
    
    // URLs predefinidas
    streamURLs map[string]string
}

func NewStreamPlayer() *StreamPlayer {
    myApp := app.New()
    
    sp := &StreamPlayer{
        app:    myApp,
        window: myApp.NewWindow("Stream Player"),
        streamURLs: map[string]string{
            "Exemplo RTMP": "rtmp://example.com/live/stream",
            "Exemplo HLS":  "https://example.com/playlist.m3u8",
            "Exemplo HTTP": "https://example.com/video.mp4",
        },
    }
    
    sp.setupUI()
    return sp
}

func (sp *StreamPlayer) setupUI() {
    sp.window.Resize(fyne.NewSize(800, 600))
    
    // Player
    sp.player = video.NewPlayer()
    
    // Controles de stream
    streamSelect := widget.NewSelect([]string{}, func(selected string) {
        if url, exists := sp.streamURLs[selected]; exists {
            sp.loadStream(url)
        }
    })
    
    // Popular opções do select
    options := make([]string, 0, len(sp.streamURLs))
    for name := range sp.streamURLs {
        options = append(options, name)
    }
    streamSelect.Options = options
    
    customURLBtn := widget.NewButton("URL Customizada", func() {
        sp.showCustomURLDialog()
    })
    
    // Status de conexão
    statusLabel := widget.NewLabel("Selecione um stream")
    
    // Layout
    controls := container.NewVBox(
        container.NewHBox(
            widget.NewLabel("Streams:"),
            streamSelect,
            customURLBtn,
        ),
        statusLabel,
    )
    
    content := container.NewBorder(
        controls, // top
        nil,      // bottom
        nil,      // left
        nil,      // right
        sp.player, // center
    )
    
    sp.window.SetContent(content)
}

func (sp *StreamPlayer) loadStream(url string) {
    uri := storage.NewURI(url)
    sp.player.Open(uri)
    sp.player.Play()
}

func (sp *StreamPlayer) showCustomURLDialog() {
    entry := widget.NewEntry()
    entry.SetPlaceHolder("rtmp://..., https://..., etc.")
    
    dialog.ShowForm("Stream Customizado", "Conectar", "Cancelar",
        []*widget.FormItem{
            {Text: "URL", Widget: entry},
        }, func(confirmed bool) {
            if confirmed && entry.Text != "" {
                sp.loadStream(entry.Text)
            }
        }, sp.window)
}

func (sp *StreamPlayer) Run() {
    sp.window.ShowAndRun()
}

func main() {
    player := NewStreamPlayer()
    player.Run()
}
```

## Captura de Câmera

### Visualizador de Câmera
```go
package main

import (
    "fmt"
    
    "fyne.io/fyne/v2/app"
    "fyne.io/fyne/v2/container"
    "fyne.io/fyne/v2/widget"
    "github.com/metal3d/fyne-streamer/video"
)

type CameraViewer struct {
    app    fyne.App
    window fyne.Window
    viewer *video.Viewer
    
    isCapturing bool
}

func NewCameraViewer() *CameraViewer {
    myApp := app.New()
    
    cv := &CameraViewer{
        app:    myApp,
        window: myApp.NewWindow("Camera Viewer"),
    }
    
    cv.setupUI()
    return cv
}

func (cv *CameraViewer) setupUI() {
    cv.window.Resize(fyne.NewSize(800, 600))
    
    // Viewer de câmera
    cv.viewer = video.NewViewer()
    
    // Controles
    startBtn := widget.NewButton("Iniciar Câmera", func() {
        cv.startCamera()
    })
    
    stopBtn := widget.NewButton("Parar Câmera", func() {
        cv.stopCamera()
    })
    
    snapshotBtn := widget.NewButton("Capturar Foto", func() {
        cv.takeSnapshot()
    })
    
    // Seleção de dispositivo
    deviceSelect := widget.NewSelect(
        []string{"/dev/video0", "/dev/video1"}, // Linux
        func(selected string) {
            if cv.isCapturing {
                cv.stopCamera()
                cv.startCameraWithDevice(selected)
            }
        },
    )
    deviceSelect.SetSelected("/dev/video0")
    
    controls := container.NewVBox(
        container.NewHBox(
            widget.NewLabel("Dispositivo:"),
            deviceSelect,
        ),
        container.NewHBox(startBtn, stopBtn, snapshotBtn),
    )
    
    content := container.NewBorder(
        controls,  // top
        nil,       // bottom
        nil,       // left
        nil,       // right
        cv.viewer, // center
    )
    
    cv.window.SetContent(content)
}

func (cv *CameraViewer) startCamera() {
    cv.startCameraWithDevice("/dev/video0")
}

func (cv *CameraViewer) startCameraWithDevice(device string) {
    // Pipeline GStreamer para câmera
    pipeline := fmt.Sprintf("v4l2src device=%s ! videoconvert ! autovideosink", device)
    
    // Abrir pipeline customizado
    cv.viewer.OpenPipeline(pipeline)
    cv.viewer.Play()
    cv.isCapturing = true
}

func (cv *CameraViewer) stopCamera() {
    cv.viewer.Stop()
    cv.isCapturing = false
}

func (cv *CameraViewer) takeSnapshot() {
    if !cv.isCapturing {
        return
    }
    
    // Implementar captura de snapshot
    // Isso pode envolver pausar o stream e capturar o frame atual
    fmt.Println("Snapshot capturado!")
}

func (cv *CameraViewer) Run() {
    cv.window.ShowAndRun()
}

func main() {
    viewer := NewCameraViewer()
    viewer.Run()
}
```

## Efeitos e Filtros

### Player com Efeitos
```go
package main

import (
    "fyne.io/fyne/v2/app"
    "fyne.io/fyne/v2/container"
    "fyne.io/fyne/v2/widget"
    "github.com/metal3d/fyne-streamer/video"
)

type EffectsPlayer struct {
    app    fyne.App
    window fyne.Window
    viewer *video.Viewer
    
    // Efeitos disponíveis
    effects map[string]string
}

func NewEffectsPlayer() *EffectsPlayer {
    myApp := app.New()
    
    ep := &EffectsPlayer{
        app:    myApp,
        window: myApp.NewWindow("Player com Efeitos"),
        effects: map[string]string{
            "Normal":       "",
            "Preto/Branco": "videoconvert ! videobalance saturation=0.0",
            "Sepia":        "coloreffects preset=sepia",
            "Negativo":     "coloreffects preset=negative",
            "Blur":         "gaussianblur sigma=3",
            "Edge":         "edgetv",
            "Emboss":       "coloreffects preset=emboss",
        },
    }
    
    ep.setupUI()
    return ep
}

func (ep *EffectsPlayer) setupUI() {
    ep.window.Resize(fyne.NewSize(900, 700))
    
    // Viewer
    ep.viewer = video.NewViewer()
    
    // Controles de efeitos
    effectSelect := widget.NewSelect([]string{}, func(selected string) {
        ep.applyEffect(selected)
    })
    
    // Popular opções
    options := make([]string, 0, len(ep.effects))
    for name := range ep.effects {
        options = append(options, name)
    }
    effectSelect.Options = options
    effectSelect.SetSelected("Normal")
    
    // Controles de arquivo
    openBtn := widget.NewButton("Abrir Vídeo", func() {
        dialog.ShowFileOpen(func(reader fyne.URIReadCloser) {
            if reader == nil {
                return
            }
            defer reader.Close()
            
            ep.loadVideo(reader.URI())
        }, ep.window)
    })
    
    playBtn := widget.NewButton("Play", func() {
        ep.viewer.Play()
    })
    
    pauseBtn := widget.NewButton("Pause", func() {
        ep.viewer.Pause()
    })
    
    controls := container.NewVBox(
        container.NewHBox(openBtn, playBtn, pauseBtn),
        container.NewHBox(
            widget.NewLabel("Efeito:"),
            effectSelect,
        ),
    )
    
    content := container.NewBorder(
        controls,   // top
        nil,        // bottom
        nil,        // left
        nil,        // right
        ep.viewer,  // center
    )
    
    ep.window.SetContent(content)
}

func (ep *EffectsPlayer) loadVideo(uri fyne.URI) {
    ep.viewer.Open(uri)
}

func (ep *EffectsPlayer) applyEffect(effectName string) {
    effect, exists := ep.effects[effectName]
    if !exists {
        return
    }
    
    // Construir pipeline com efeito
    var pipeline string
    if effect == "" {
        // Sem efeito
        pipeline = "playbin uri=file:///path/to/video.mp4"
    } else {
        // Com efeito
        pipeline = fmt.Sprintf("filesrc location=/path/to/video.mp4 ! decodebin ! %s ! videoconvert ! autovideosink", effect)
    }
    
    // Aplicar pipeline customizado
    ep.viewer.OpenPipeline(pipeline)
}

func (ep *EffectsPlayer) Run() {
    ep.window.ShowAndRun()
}

func main() {
    player := NewEffectsPlayer()
    player.Run()
}
```

## Tratamento de Erros e Logs

### Logging e Debug
```go
package main

import (
    "log"
    "os"
    
    "fyne.io/fyne/v2/widget"
    "github.com/metal3d/fyne-streamer/video"
)

type MediaLogger struct {
    logArea   *widget.Entry
    player    *video.Player
    logFile   *os.File
}

func NewMediaLogger() *MediaLogger {
    // Criar arquivo de log
    logFile, err := os.OpenFile("media.log", os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0666)
    if err != nil {
        log.Fatalln("Erro ao criar arquivo de log:", err)
    }
    
    ml := &MediaLogger{
        logArea: widget.NewMultiLineEntry(),
        logFile: logFile,
    }
    
    // Configurar log personalizado
    log.SetOutput(ml.logFile)
    
    return ml
}

func (ml *MediaLogger) LogInfo(message string) {
    log.Printf("[INFO] %s", message)
    ml.appendToLogArea(fmt.Sprintf("[INFO] %s\n", message))
}

func (ml *MediaLogger) LogError(message string, err error) {
    log.Printf("[ERROR] %s: %v", message, err)
    ml.appendToLogArea(fmt.Sprintf("[ERROR] %s: %v\n", message, err))
}

func (ml *MediaLogger) appendToLogArea(text string) {
    currentText := ml.logArea.Text
    ml.logArea.SetText(currentText + text)
    
    // Auto-scroll para o final
    ml.logArea.CursorRow = len(ml.logArea.Text)
}

func (ml *MediaLogger) Close() {
    if ml.logFile != nil {
        ml.logFile.Close()
    }
}
```

## Integração com Sistema de Arquivos

### Navegador de Mídia
```go
func (app *MediaApp) createMediaBrowser() *fyne.Container {
    // Lista de arquivos de mídia
    mediaList := widget.NewList(
        func() int { return len(app.mediaFiles) },
        func() fyne.CanvasObject {
            return container.NewHBox(
                widget.NewIcon(theme.DocumentIcon()),
                widget.NewLabel("Arquivo"),
                widget.NewLabel("Duração"),
            )
        },
        func(i widget.ListItemID, o fyne.CanvasObject) {
            if i < len(app.mediaFiles) {
                file := app.mediaFiles[i]
                container := o.(*container.Container)
                
                icon := container.Objects[0].(*widget.Icon)
                nameLabel := container.Objects[1].(*widget.Label)
                durationLabel := container.Objects[2].(*widget.Label)
                
                // Definir ícone baseado no tipo
                if app.isVideoFile(file.Name) {
                    icon.SetResource(theme.MediaVideoIcon())
                } else {
                    icon.SetResource(theme.MediaMusicIcon())
                }
                
                nameLabel.SetText(file.Name)
                durationLabel.SetText(app.getFileDuration(file.Path))
            }
        },
    )
    
    return container.NewBorder(
        widget.NewButton("Atualizar", func() {
            app.scanMediaFiles()
        }),
        nil,
        nil,
        nil,
        mediaList,
    )
}
```

## Próximos Passos

Continue para [Exemplos Avançados](../exemplos-avancados/index.md) onde encontrará exemplos práticos completos e projetos reais usando Fyne.io.

---

**💡 Dica**: O GStreamer é uma dependência pesada, mas oferece suporte robusto para múltiplos formatos de mídia. Para projetos simples, considere alternativas mais leves!