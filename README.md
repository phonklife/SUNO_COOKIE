# SUNO_COOKIE

Minimalny, lokalny toolkit Node.js/TypeScript do bezpiecznego sprawdzania konfiguracji sesji Suno bez ujawniania sekretu.

## Założenia

- wartość `SUNO_COOKIE` jest dostarczana przez użytkownika lokalnie;
- sekret nie jest zapisywany w repozytorium;
- CLI nigdy nie wypisuje pełnej wartości cookie;
- projekt nie odczytuje automatycznie cookies z przeglądarki i nie przechwytuje cudzych sesji.

## Wymagania

- Node.js 20+
- npm

## Start

```bash
npm install
cp .env.example .env
```

Ustaw `SUNO_COOKIE` w swoim środowisku. Plik `.env` jest ignorowany przez Git.

Ponieważ projekt nie dodaje zależności runtime do ładowania `.env`, uruchom wartość przez środowisko systemowe, np.:

```bash
SUNO_COOKIE="your-own-session-value" npm run build
SUNO_COOKIE="your-own-session-value" npm start
```

Windows PowerShell:

```powershell
$env:SUNO_COOKIE="your-own-session-value"
npm run build
npm start
```

## Komendy

```bash
npm run check   # type-check bez generowania plików
npm run build   # kompilacja do dist/
npm test        # build + testy Node
npm start       # sprawdzenie konfiguracji i zredagowany status
```

Przykładowy wynik:

```text
SUNO_COOKIE configuration: OK
Value: abcd…wxyz
Secret remains local and is never printed in full.
```

## Struktura

```text
src/config.ts       walidacja zmiennych środowiskowych
src/redact.ts       bezpieczne redagowanie sekretów
src/index.ts        CLI
test/redact.test.ts testy konfiguracji i redakcji
```

## Następny etap

Kolejnym modułem może być jawny adapter HTTP korzystający wyłącznie z sesji dostarczonej przez właściciela konta, z ograniczonym zakresem operacji, timeoutami i bez logowania danych uwierzytelniających.
