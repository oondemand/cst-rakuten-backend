# Define o diretório raiz para iniciar a busca
$rootDir = "../.."

# Função para verificar se um caminho está dentro de um diretório node_modules
function Is-InNodeModules {
    param (
        [string]$path
    )
    return $path -match "\\node_modules\\"
}

# Obter todas as pastas e arquivos recursivamente, excluindo as pastas node_modules
$items = Get-ChildItem -Path $rootDir -Recurse | Where-Object { -not (Is-InNodeModules $_.FullName) -and $_.Name -ne "package-lock.json" }

foreach ($item in $items) {
    if ($item.PSIsContainer) {
        Write-Host "Pasta encontrada: $($item.FullName)"
    } else {
        Write-Host "Conteúdo do arquivo: $($item.FullName)"
        Get-Content -Path $item.FullName
        Write-Host "`n"  # Adiciona uma nova linha para melhor legibilidade
    }
}