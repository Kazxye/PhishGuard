# PhishGuard - Browser Extension

Extensão de navegador para detecção de phishing em tempo real.

## Features

- ✅ Análise automática ao visitar sites
- ✅ Badge colorido indicando nível de risco
- ✅ Interface minimalista com opção de visão detalhada
- ✅ Dark mode
- ✅ Histórico das últimas 10 análises
- ✅ Whitelist de sites confiáveis
- ✅ Notificações para sites de alto risco
- ✅ Botão para reportar sites suspeitos

## Instalação para Desenvolvimento

### Pré-requisitos

- Node.js 18+
- npm ou yarn
- Backend PhishGuard rodando em `http://localhost:8000`

### Setup

```bash
cd extension

# Instalar dependências
npm install

# Build em modo watch (desenvolvimento)
npm run dev

# Build para produção
npm run build
```

### Carregar no Chrome

1. Abra `chrome://extensions/`
2. Ative o "Modo do desenvolvedor" (canto superior direito)
3. Clique em "Carregar sem compactação"
4. Selecione a pasta `extension/dist`

### Carregar no Edge

1. Abra `edge://extensions/`
2. Ative o "Modo do desenvolvedor"
3. Clique em "Carregar descompactada"
4. Selecione a pasta `extension/dist`

## Gerando Ícones

Os ícones PNG precisam ser gerados a partir do SVG. Você pode usar:

### Opção 1: Ferramenta online
1. Acesse [SVG to PNG](https://svgtopng.com/)
2. Faça upload de `public/icons/icon.svg`
3. Gere nas dimensões: 16x16, 48x48, 128x128
4. Salve como `icon-16.png`, `icon-48.png`, `icon-128.png`

### Opção 2: ImageMagick (linha de comando)
```bash
convert -background none -resize 16x16 icon.svg icon-16.png
convert -background none -resize 48x48 icon.svg icon-48.png
convert -background none -resize 128x128 icon.svg icon-128.png
```

### Opção 3: Figma / Canva
Importe o SVG e exporte nos tamanhos necessários.

## Estrutura do Projeto

```
extension/
├── src/
│   ├── background/         # Service Worker
│   ├── content/           # Content Script (DOM analysis)
│   ├── popup/             # React UI
│   │   └── components/    # Componentes React
│   ├── shared/            # Código compartilhado
│   └── styles/            # CSS / Tailwind
├── public/
│   ├── manifest.json      # Manifest V3
│   └── icons/             # Ícones da extensão
└── dist/                  # Build output
```

## Tecnologias

- TypeScript
- React 18
- Tailwind CSS
- Vite
- Chrome Extensions Manifest V3

## Configuração da API

Por padrão, a extensão conecta em `http://localhost:8000/api/v1`.

Para alterar:
1. Clique no ícone da extensão
2. Vá em "Config"
3. Altere a URL do backend

## Troubleshooting

### Extensão não carrega
- Verifique se o build foi gerado (`npm run build`)
- Verifique se os ícones PNG existem em `dist/icons/`
- Confira erros no console do Service Worker

### API não conecta
- Certifique-se que o backend está rodando
- Verifique se a URL está correta nas configurações
- Confira o CORS no backend

### Análise não executa
- Verifique se o site não está na whitelist
- Confira o console do popup (F12 no popup)
