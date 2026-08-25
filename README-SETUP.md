# HORXS — Arquivo de Reviews (v2: registo + aprovação)

## Novo sistema de contas

Já NÃO precisas de criar os teus amigos manualmente no Firebase.

Fluxo:

1. Visitante carrega em `IDENTIFICAR-SE`.
2. Escolhe `CRIAR IDENTIFICAÇÃO`.
3. Introduz nick, email e palavra-passe.
4. Firebase Authentication cria a conta.
5. Firestore cria automaticamente o perfil:
   - `role: reviewer`
   - `status: pending`
6. A conta pode entrar e ver o site, mas NÃO pode avaliar.
7. No teu `PAINEL ADMIN -> PEDIDOS DE ACESSO` aparece o pedido.
8. Tu carregas `APROVAR`.
9. O perfil passa para `status: approved`.
10. A partir daí a pessoa pode avaliar.

Se carregares `RECUSAR`, fica com `status: rejected` e continua sem poder avaliar.

## IMPORTANTE — atualiza as Firestore Rules

Se já tinhas colocado as regras da versão antiga:

1. Firebase Console.
2. `Firestore -> Regras`.
3. Abre o ficheiro `firestore.rules` DESTA versão.
4. Copia tudo.
5. Substitui todo o conteúdo no editor do Firebase.
6. Carrega `Publicar`.

Sem isto, o auto-registo não funciona corretamente.

## A tua conta Admin

A tua conta continua a ser criada manualmente UMA vez:

Authentication -> Users -> Add user

Depois Firestore -> users -> documento com ID igual ao teu UID:

- `displayName` (string): `MP`
- `role` (string): `admin`

O Admin NÃO precisa de `status`.

## Authentication

Em:

Authentication -> Sign-in method -> Email/Password

tem de estar:

- Email/Password: ON
- Email link: OFF

Não existe qualquer botão extra no Firebase para permitir registo.
Quando Email/Password está ativo, `createUserWithEmailAndPassword` pode criar contas pelo site.

## O que um pendente pode fazer

- Ver arquivos: SIM
- Ver episódios: SIM
- Ver resultados: SIM
- Entrar na conta: SIM
- Avaliar: NÃO
- Publicar: NÃO

## Reviewer aprovado

- Ver: SIM
- Avaliar: SIM
- Alterar o próprio voto: SIM
- Publicar: NÃO

## Admin

- Tudo acima
- Criar arquivos
- Publicar episódios
- Aprovar e recusar contas

## Segurança

Isto não depende apenas da interface.

As Firestore Security Rules exigem que a conta seja:

- `role == admin`; ou
- `role == reviewer` E `status == approved`

antes de aceitar uma avaliação.

Uma conta pendente que tente enviar um voto pelo DevTools recebe `permission-denied`.
