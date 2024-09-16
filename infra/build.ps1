# Verifica se todos os parâmetros necessários foram passados
param (
    [string]$VERSION
)

if (-not $VERSION) {
    Write-Host "Erro: Por favor, forneça o número da versão. Exemplo: .\deploy.ps1 -VERSION 0.0.7"
    exit 1
}

# Constantes
$IMAGE_NAME = "central-de-servicos-backend"

# Passo 1: Construir a imagem Docker
Write-Host "Construindo a imagem Docker..."
docker build -t "${IMAGE_NAME}:${VERSION}" .

# Passo 2: Testar a imagem localmente (opcional)
Write-Host "Testando a imagem localmente..."
$containerId = docker run -d -p 4000:4000 "${IMAGE_NAME}:${VERSION}"

# Aguarda alguns segundos para garantir que o container esteja rodando
Start-Sleep -Seconds 5

# Verifica se a aplicação está rodando corretamente
if ((Invoke-WebRequest -Uri http://localhost:4000).StatusCode -eq 401) {
    Write-Host "Aplicação está rodando corretamente."
} else {
    Write-Host "Erro ao rodar a aplicação localmente. Verifique os logs e tente novamente."
    docker stop $containerId
    exit 1
}

# Para o container de teste
docker stop $containerId

Write-Host "Build completo!"