# MULT SILK CAMISETAS — Site, painel administrativo e atendente com IA

Versão 2.0 — preparada para o repositório público [multsilkcamisetas-beep/mult-silk-camisetas](https://github.com/multsilkcamisetas-beep/mult-silk-camisetas).

## O que este pacote contém

- Site original preservado, com 75 fotos e artes, catálogo e orçamento pelo WhatsApp.
- `/admin/` — painel para cadastrar, alterar e ocultar produtos, preencher preço e enviar fotos.
- `/api/admin/*` — autenticação de sessão segura, gravação no repositório GitHub e upload de imagens.
- `/api/chat.js` — atendente com IA. A chave da API OpenAI fica apenas no servidor Vercel.
- `catalogo.json` — catálogo inicial importado das 18 coleções existentes.

**IMPORTANTE:** O painel e a IA não funcionarão até que você configure as variáveis de ambiente abaixo. O site público continuará mostrando os produtos e as fotos mesmo antes dessa configuração. **Não coloque senhas nem tokens em nenhum arquivo do GitHub**.

## 1. Publicar a atualização no GitHub

1. Extraia o arquivo `MULT-SILK-PAINEL-IA-PARA-GITHUB.zip`.
2. Abra a pasta extraída `MULT-SILK-PAINEL-IA`.
3. No repositório https://github.com/multsilkcamisetas-beep/mult-silk-camisetas, escolha **Add file → Upload files**.
4. Envie os arquivos e pastas que estão **DENTRO** de `MULT-SILK-PAINEL-IA`, incluindo `api`, `lib`, `admin`, `assets`, `catalogo.json`, `index.html`, `catalogo-data.js`, `package.json` e `README.md`. Preserve as subpastas.
5. Confirme **Commit changes**; substitua arquivos com nomes idênticos caso solicitado. A branch deve ser `main`.
6. Confirme a nova implantação em **Vercel → mult-silk-camisetas → Deployments**. O site permanece em https://mult-silk-camisetas.vercel.app.

*Se o GitHub não aceitar enviar pastas por seleção de arquivos, arraste a pasta para a área de upload ou use o GitHub Desktop. Não envie somente o ZIP.*

## 2. Criar um token do GitHub só para o catálogo

1. Em sua conta GitHub, vá a **Settings → Developer settings → Personal access tokens → Fine-grained tokens**.
2. Clique em criar um token. Escolha **somente** o repositório `multsilkcamisetas-beep/mult-silk-camisetas`.
3. Permissão de repositório: **Contents → Read and write**. Não conceda outras permissões se não for necessário.
4. Ajuste uma data de expiração e guarde a data para renovar quando vencer.
5. Copie o token e configure-o **somente na Vercel** na variável `GITHUB_TOKEN`.

O token permite ao painel publicar commits de produtos e fotos automaticamente. Se expirar, os visitantes ainda verão o catálogo anterior, mas o painel deixará de salvar até a renovação.

## 3. Criar senha e segredo de sessão

Escolha uma senha **forte e exclusiva**, de pelo menos 12 caracteres, e use-a apenas na variável `ADMIN_PASSWORD` da Vercel. **Não compartilhe a senha comigo nem a publique no GitHub**.

Para `SESSION_SECRET`, gere uma sequência aleatória de pelo menos 32 caracteres. Exemplo pelo PowerShell, **caso tenha Node.js instalado**:

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copie a saída **apenas** para a variável `SESSION_SECRET` na Vercel. Não use o exemplo de um tutorial como segredo.

## 4. Ativar o atendente com IA (opcional)

1. Crie uma chave de API na [plataforma OpenAI](https://platform.openai.com/api-keys).
2. Configure a chave em `OPENAI_API_KEY` **somente na Vercel**.
3. Opcionalmente configure `OPENAI_MODEL` (padrão definido no código: `gpt-4o-mini`).

**Atenção:** sua assinatura do ChatGPT não inclui automaticamente o uso da API. O uso da API pode gerar cobranças separadas. Nunca copie a chave para o HTML, código JavaScript público ou GitHub. As mensagens enviadas ao assistente do site são processadas pelo serviço de IA.

Quando a chave não está configurada, o widget informa que a IA está indisponível e oferece atendimento via WhatsApp.

## 5. Variáveis na Vercel

Abra o projeto `mult-silk-camisetas` na Vercel e entre em **Settings → Environment Variables**. Cadastre os seguintes nomes (valores devem ser fornecidos diretamente no painel Vercel):

| Nome | Obrigatória? | Conteúdo |
|---|---|---|
| `ADMIN_PASSWORD` | Sim para painel | Senha forte e exclusiva (12+ caracteres) |
| `SESSION_SECRET` | Sim para painel | Segredo aleatório de 32+ caracteres |
| `GITHUB_TOKEN` | Sim para painel | Token fine-grained com Contents Read and write, só no repositório |
| `OPENAI_API_KEY` | Para IA | Chave da API OpenAI, com cobrança própria |
| `OPENAI_MODEL` | Não | `gpt-4o-mini` ou outro modelo habilitado na API |
| `GITHUB_REPO` | Não | `multsilkcamisetas-beep/mult-silk-camisetas` |
| `GITHUB_BRANCH` | Não | `main` |

Use o ambiente **Production**. Para testar em previews, configure também **Preview**. Após salvar as variáveis, **faça Redeploy da versão mais recente** para garantir que as funções as recebam.

## 6. Como usar

- Site: https://mult-silk-camisetas.vercel.app
- Painel: https://mult-silk-camisetas.vercel.app/admin/
- Atendente: botão **Atendimento com IA** no canto inferior da página.

No painel: faça login → **Adicionar produto** / **Editar fotos e dados** → informe nome, categoria, descrição, preço opcional → envie imagens → **Salvar no catálogo**. O painel cria commits no GitHub e o projeto conectado à Vercel publica a alteração automaticamente. Uma foto só aparece na vitrine quando você salva o produto após enviá-la.

## Segurança e funcionamento

- O login é validado no servidor; não existe senha embutida nos arquivos públicos.
- A sessão usa cookie HttpOnly com assinatura HMAC, validade de 8 horas e SameSite=Strict.
- Alterações de catálogo e upload exigem autenticação, origem do próprio site e token GitHub no servidor.
- Somente arquivos JPG, PNG e WEBP são aceitos no upload (até 1,7 MB após redução automática).
- O painel é para **um administrador**. Não fornece múltiplas contas nem recuperação de senha por e-mail.
- A limitação de tentativas de login e de mensagens à IA é básica e em memória por instância. Para exposição ampla da IA, habilite também proteção de tráfego e limites de gasto na Vercel/OpenAI.
- Não deixe informações pessoais de clientes na descrição pública dos produtos.
- Não há pagamentos online, coleta de cartão nem promessa de preços, disponibilidade ou prazos; o orçamento é confirmado pelo WhatsApp (16) 98137-3999.

## Se algo não funcionar

- **Painel mostra 'não configurado'**: revise `ADMIN_PASSWORD`, `SESSION_SECRET`, `GITHUB_TOKEN` em Settings → Environment Variables, depois Redeploy.
- **Erro 403 do GitHub**: o token está sem acesso de gravação ao repositório ou a integração o bloqueou.
- **Erro de versão ao salvar**: clique em **Atualizar lista** e tente novamente.
- **Foto não apareceu**: confira se o upload terminou e se você clicou em **Salvar no catálogo**; depois confira a última implantação na Vercel e atualize com Ctrl+F5.
- **IA indisponível**: revise `OPENAI_API_KEY`, disponibilidade e faturamento da API OpenAI e o redeploy.
- **ChatGPT/Conector Vercel com erro 403**: usar o GitHub para publicar é independente da autorização do conector no ChatGPT.