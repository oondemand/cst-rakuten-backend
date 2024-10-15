# Definir a versão da imagem, nome da imagem e o URL do registro de container
$VERSION = "0.2.0"
$IMAGE_NAME = "cst-rakuten-backend"

# Verificar se $IMAGE_NAME está em minúsculas, já que Docker exige isso
if ($IMAGE_NAME -ne $IMAGE_NAME.ToLower()) {
    Write-Host "Erro: O nome da imagem deve ser minúsculo. Atualize o valor de IMAGE_NAME."
    exit 1
} 

# Fazer o build da imagem com a versão específica e com a tag latest
Write-Host "Construindo a imagem Docker para $IMAGE_NAME nas versões $VERSION e latest..."
docker build -f ../docker/Dockerfile.prod -t "${IMAGE_NAME}:${VERSION}" -t "${IMAGE_NAME}:latest" ../..

Write-Host "Build completo!"