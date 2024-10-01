# Definir a versão da imagem, nome da imagem e o URL do registro de container
$VERSION = "1.0.6"
$IMAGE_NAME = "central-servicos-backend"
$REGISTRY_URL = "registry.digitalocean.com/oondemand"

# Verificar se $IMAGE_NAME está em minúsculas, já que Docker exige isso
if ($IMAGE_NAME -ne $IMAGE_NAME.ToLower()) {
    Write-Host "Erro: O nome da imagem deve ser minúsculo. Atualize o valor de IMAGE_NAME."
    exit 1
}

# Fazer o build da imagem com a versão específica e com a tag latest
Write-Host "Construindo a imagem Docker para $IMAGE_NAME nas versões $VERSION e latest..."
docker build -f ../docker/Dockerfile.prod -t "${IMAGE_NAME}:${VERSION}" -t "${IMAGE_NAME}:latest" ../..

# Verificar se o build foi bem-sucedido
if ($LASTEXITCODE -ne 0) {
    Write-Host "Erro: Falha ao construir a imagem."
    exit 1
}

# Tag e push da imagem para o Container Registry
Write-Host "Fazendo o push da imagem com a versão $VERSION para o Container Registry $REGISTRY_URL..."
docker tag "${IMAGE_NAME}:${VERSION}" "${REGISTRY_URL}/${IMAGE_NAME}:${VERSION}"
docker push "${REGISTRY_URL}/${IMAGE_NAME}:${VERSION}"

if ($LASTEXITCODE -ne 0) {
    Write-Host "Erro: Falha ao fazer o push da imagem com a versão $VERSION para o Container Registry."
    exit 1
}

# Push da tag latest para o Container Registry
Write-Host "Fazendo o push da imagem com a tag latest para o Container Registry $REGISTRY_URL..."
docker tag "${IMAGE_NAME}:latest" "${REGISTRY_URL}/${IMAGE_NAME}:latest"
docker push "${REGISTRY_URL}/${IMAGE_NAME}:latest"

if ($LASTEXITCODE -ne 0) {
    Write-Host "Erro: Falha ao fazer o push da imagem com a tag latest para o Container Registry."
    exit 1
}

# Caminhos relativos para os arquivos Kubernetes (da pasta scripts para infra/kubernetes)
$deploymentFile = "../kubernetes/deployment.yaml"
$serviceFile = "../kubernetes/service.yaml"
$ingressFile = "../kubernetes/ingress.yaml"

# Verifica se os arquivos Kubernetes existem antes de aplicar
if (-not (Test-Path $deploymentFile)) {
    Write-Host "Erro: Arquivo de deployment não encontrado: $deploymentFile"
    exit 1
}

if (-not (Test-Path $serviceFile)) {
    Write-Host "Erro: Arquivo de service não encontrado: $serviceFile"
    exit 1
}

if (-not (Test-Path $ingressFile)) {
    Write-Host "Erro: Arquivo de ingress não encontrado: $ingressFile"
    exit 1
}

# Aplicar os arquivos do Kubernetes
Write-Host "Aplicando deployment no Kubernetes..."
kubectl apply -f $deploymentFile
if ($LASTEXITCODE -ne 0) {
    Write-Host "Erro ao aplicar deployment no Kubernetes."
    exit 1
}

Write-Host "Aplicando service no Kubernetes..."
kubectl apply -f $serviceFile
if ($LASTEXITCODE -ne 0) {
    Write-Host "Erro ao aplicar service no Kubernetes."
    exit 1
}

Write-Host "Aplicando ingress no Kubernetes..."
kubectl apply -f $ingressFile
if ($LASTEXITCODE -ne 0) {
    Write-Host "Erro ao aplicar ingress no Kubernetes."
    exit 1
}

# Se nenhum erro ocorreu até aqui, exibir a mensagem de sucesso
Write-Host "Deploy realizado com sucesso!"
