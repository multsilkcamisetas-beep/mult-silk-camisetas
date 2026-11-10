# MULT SILK — Ativação do painel de administração online

O catálogo público já existe em index.html + catalogo-data.js e as fotos ficam em assets/.
Esta etapa adiciona admin.html e /api/admin (função Node.js da Vercel).

## Segurança primeiro

- O formulário de login é público, mas leitura/escrita do catálogo exige sessão autenticada.
- A senha e o token NUNCA devem ser colocados em arquivos do GitHub ou na conversa do ChatGPT.
- Uma senha longa e exclusiva é obrigatória (mínimo 14 caracteres; recomendado 24+).
- Não usa localStorage para salvar token, senha ou sessão.
- A sessão usa cookie assinado HttpOnly, Secure e SameSite=Strict, com 12 horas de validade.
- A API exige mesma origem para gravações; não aceita atualização com token do navegador.
- **Antes de publicar para clientes, ative uma regra de rate limiting da Vercel Firewall para /api/admin** (especialmente POST), para impedir ataques de tentativa de senha.
- Se suspeitar vazamento, troque ADMIN_PASSWORD, ADMIN_SESSION_SECRET e revogue GITHUB_TOKEN.

## Etapa A — confirmar Vercel

Entre no projeto Vercel que **já hospeda o site**. Confirme que ele está vinculado ao repositório:
https://github.com/multsilkcamisetas-beep/mult-silk-camisetas

Framework: Other / site estático. Não é necessário npm install nem build.
A pasta api/ deve permanecer na raiz.

**Não crie um novo projeto na Vercel se o site existente já está ativo:** a prioridade é conectar esta funcionalidade ao projeto correto.

## Etapa B — variáveis de ambiente da Vercel

Acesse Project > Settings > Environment Variables. Configure as seguintes variáveis no ambiente **Production**:

| Nome | Conteúdo |
|------|----------|
| ADMIN_PASSWORD | Uma senha forte e exclusiva escolhida por você, com 14 ou mais caracteres (recomendado 24+) |
| ADMIN_SESSION_SECRET | Uma frase aleatória e independente de 32+ caracteres; idealmente gerada pelo gerenciador de senhas |
| GITHUB_TOKEN | Fine-grained Personal Access Token do GitHub, com acesso ao repositório acima e permissão **Contents: Read and write** |
| GITHUB_REPOSITORY | multsilkcamisetas-beep/mult-silk-camisetas |
| GITHUB_BRANCH | main |

Para criar um token: GitHub > Settings > Developer settings > Personal access tokens > Fine-grained tokens. Escolha só o repositório MULT SILK e só a permissão Contents (Read and write). Defina validade limitada e renove antes de expirar.

**Não envie a senha ou token para outras pessoas, por e-mail, ou aqui no chat.** Cadastre diretamente nos formulários da Vercel.

Depois de criar/editar as variáveis, faça um novo deploy da produção.

## Etapa C — primeiro acesso e testes

1. Publique a branch apenas depois de configurar as variáveis e revisar a alteração.
2. Abra https://SEU-DOMINIO/admin.html, usando a sua URL real do site.
3. Digite a senha ADMIN_PASSWORD. O painel deve abrir e mostrar os modelos existentes.
4. Edite a descrição de um modelo de teste e clique em **Salvar e publicar**.
5. Confira o commit no GitHub e aguarde a Vercel publicar a atualização.
6. Atualize o site público e confira o texto. Para foto nova, faça o envio pelo painel e salve o produto.

O painel não permite modificar arquivos locais no seu computador: a gravação acontece via API segura -> GitHub -> deploy automático da Vercel.

## Preços

O campo "Preço em R$" é opcional. Quando preenchido, o site mostra "A partir de R$ …", sujeito a confirmação no orçamento. Sem preço cadastrado, o catálogo continua apenas com "Orçamento".

## Limitações desta primeira versão

- O painel usa um só login de administrador; não há níveis de equipe.
- O catálogo é atualizado com commits no GitHub, e o site é atualizado após o deploy (não instantaneamente).
- Fotos são convertidas em WebP no navegador e enviadas individualmente (até 2,5 MB).
- As fotos que você remover do produto deixam de aparecer, mas não são excluídas automaticamente do histórico do GitHub.
- O sistema pressupõe que a Vercel esteja ligada ao GitHub e faça deploys de main.
- A senha é configurada diretamente na Vercel, não na página pública.
- A API tem validação e proteção de origem, mas a proteção contra força bruta depende da regra da Vercel Firewall mencionada acima.

## Se o login não abrir

- "Painel ainda não configurado": cadastre ADMIN_PASSWORD e ADMIN_SESSION_SECRET.
- "Falta configurar GITHUB_TOKEN": confirme token e permissões no ambiente Production.
- Erro 404 em /api/admin: verifique se o site está hospedado na Vercel com a pasta api/ na raiz.
- "Sua sessão expirou": entre novamente.
- Conflito ao salvar: atualize o painel para ler o catálogo mais recente. Evite dois administradores editando ao mesmo tempo.
