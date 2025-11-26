# Teste de Imagens

Para verificar se as imagens estão carregando corretamente, acesse:

1. **Hero Image (Lia):**
   - URL: `/images/uploads/Lucid_Origin_Create_an_image_of_Lia_a_young_woman_with_mediuml_0-2-1080x1080.jpg`
   - Deve aparecer na seção Hero

2. **About Image:**
   - URL: `/images/uploads/about-1024x709.jpg`
   - Deve aparecer na seção "Sobre a Lia"

3. **Content Image:**
   - URL: `/images/uploads/content1-721x1080.jpg`
   - Deve aparecer na seção "Como Funciona"

## Verificação

Se as imagens não aparecerem:

1. Verifique se o servidor está rodando: `npm start`
2. Acesse diretamente a URL da imagem no navegador
3. Verifique o console do navegador (F12) para erros 404
4. Confirme que os arquivos existem em `public/images/uploads/`

## Estrutura de Pastas

```
appointment-nodejs/
└── public/
    └── images/
        └── uploads/
            ├── Lucid_Origin_Create_an_image_of_Lia_a_young_woman_with_mediuml_0-2-1080x1080.jpg
            ├── about-1024x709.jpg
            └── content1-721x1080.jpg
```


