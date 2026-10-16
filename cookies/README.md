# cookies/

Lokalny katalog na ciasteczka Suno. Zawartość jest ignorowana przez git (`.gitignore`).

## Zasady
- Repo jest publiczne: prawdziwy cookie tylko lokalnie lub w GitHub Secrets.
- Plik lokalny: `cookies/suno_cookie.txt` (nie jest commitowany).
- CI / Actions: Settings → Secrets and variables → Actions → `SUNO_COOKIE`.

## Weryfikacja przed commitem
```
git check-ignore -v cookies/suno_cookie.txt
```
Wynik z linią `.gitignore` = plik chroniony.
