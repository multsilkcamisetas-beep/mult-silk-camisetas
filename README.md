# MULT SILK CAMISETAS

Site institucional e catálogo de camisetas personalizadas, com orçamento pelo WhatsApp.

## Publicar no GitHub

1. Acesse https://github.com/new e crie um repositório com o nome `mult-silk-camisetas` (ou outro nome de sua preferência).
2. Entre no repositório e clique em **Add file → Upload files**.
3. **Depois de extrair o ZIP**, abra a pasta `MULT-SILK-GitHub` e envie **o conteúdo dela**, principalmente `index.html`, `catalogo-data.js` e a pasta `assets` (incluindo `premium`). O `index.html` deve ficar na raiz do repositório.
4. Clique em **Commit changes**.

Se a interface do GitHub não permitir enviar a pasta `assets` completa, prefira usar o **GitHub Desktop** para publicar a pasta extraída, preservando suas subpastas.

## Hospedar pela Vercel

1. Entre em https://vercel.com/new.
2. Escolha **Import Git Repository** e autorize o acesso ao repositório `mult-silk-camisetas` no GitHub.
3. Configure **Framework Preset: Other** e mantenha a **Root Directory** como `./`.
4. Faça o deploy. O site é estático, sem etapas de instalação ou compilação.
5. Abra o endereço gerado e confira as fotos, o catálogo e o WhatsApp **(16) 98137-3999**.

## Editar o catálogo

As informações das camisetas ficam em `catalogo-data.js` e as imagens ficam em `assets/`. O painel visual que você recebeu separadamente funciona **localmente**; ele não está neste repositório público porque não tem autenticação. Após gerar os arquivos atualizados com o painel, substitua os correspondentes no repositório e faça um novo commit. A Vercel poderá publicar as mudanças automaticamente quando o repositório estiver conectado.

## Estrutura

- `index.html`: página pública
- `catalogo-data.js`: dados do catálogo
- `assets/`: imagens, banners e logos
- `.gitignore`: arquivos locais que não devem ser publicados

**Observação:** as fotos e mockups incluídos foram fornecidos pelo proprietário da marca para uso no catálogo. Não existe sistema de pagamento online nem painel administrativo autenticado na hospedagem.
