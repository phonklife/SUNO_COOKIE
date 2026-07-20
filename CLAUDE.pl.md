# CLAUDE.md

Ten plik zawiera wskazówki dla Claude Code (claude.ai/code) dotyczące pracy z kodem w tym repozytorium.

## Przegląd projektu

**Suno API Client Library** — hybrydowa biblioteka Python i Node.js/TypeScript do współpracy z API Suno AI.

## Struktura i architektura projektu

To jest monorepo zawierające zintegrowane pakiety Python i TypeScript:

```
/python          - pakiet klienta Python
  /suno          - główny moduł Python
  /tests         - testy jednostkowe Python (pytest)
  requirements.txt
  setup.py lub pyproject.toml

/node (lub /typescript)
  /src           - kod źródłowy TypeScript
  /tests         - testy TypeScript/Jest
  package.json
  tsconfig.json

/docs            - dokumentacja API i przewodniki użytkowania
README.md        - opis projektu i szybki start
```

### Kluczowe uwagi dotyczące architektury

1. **Projekt dwujęzyczny**: Klienci Python i TypeScript udostępniają podobne interfejsy do API Suno. Utrzymuj spójność API pomiędzy implementacjami.

2. **Uwierzytelnianie**: Biblioteka obsługuje uwierzytelnianie w API Suno. Przechowuj metody uwierzytelniania w jasny sposób — niezależnie od tego, czy używane są klucze API, tokeny OAuth, czy uwierzytelnianie oparte na sesji. Dokumentuj przepływ uwierzytelniania w widocznym miejscu.

3. **Wzorce zapytań**: Wywołania API powinny być spójne w obu językach. Stosuj podobną logikę ponawiania prób, obsługę limitów czasu oraz propagację błędów.

4. **Obsługa błędów**: Zdefiniuj wspólny zestaw typów błędów/wyjątków (np. `AuthenticationError`, `RateLimitError`, `NotFoundError`). Obie implementacje powinny stosować równoważną obsługę błędów.

5. **Bezpieczeństwo typów**: Kod TypeScript powinien być ściśle typowany. Kod Python powinien wykorzystywać podpowiedzi typów (moduł `typing`) dla przejrzystości.

## Polecenia deweloperskie

### Python

```bash
# Konfiguracja środowiska wirtualnego
python -m venv venv
source venv/bin/activate  # lub 'venv\Scripts\activate' w Windows

# Instalacja zależności
pip install -r requirements.txt
pip install -e .  # Instalacja pakietu w trybie edytowalnym

# Uruchamianie testów
pytest
pytest -v                    # Tryb szczegółowy (verbose)
pytest tests/test_client.py  # Pojedynczy plik testowy

# Sprawdzanie typów
mypy suno/

# Linting i formatowanie (jeśli skonfigurowane)
ruff check suno/
black suno/
```

### Node.js/TypeScript

```bash
# Instalacja zależności
npm install

# Uruchamianie testów
npm test
npm test -- --watch  # Tryb obserwacji (watch mode)

# Sprawdzanie typów
npm run type-check
# lub
tsc --noEmit

# Budowanie
npm run build

# Linting i formatowanie (jeśli skonfigurowane)
npm run lint
npm run format
```

## Testowanie i jakość

- **Testy jednostkowe**: Utrzymuj pokrycie testami dla wszystkich publicznych API. Używaj mocków dla zewnętrznych wywołań API Suno.
- **Testy integracyjne** (jeśli dotyczy): Testuj względem środowisk staging/sandbox.
- **Hooki pre-commit**: Skonfiguruj hooki uruchamiające sprawdzanie typów i linting przed commitami.
- **CI/CD**: GitHub Actions powinien uruchamiać testy, sprawdzanie typów i linting przy pull requestach.

## Konwencje kodu

### Python
- Używaj podpowiedzi typów dla wszystkich sygnatur funkcji.
- Przestrzegaj stylu PEP 8.
- Docstringi dla publicznych klas i metod (styl Google lub NumPy).
- Minimalna liczba komentarzy w kodzie; wyjaśniaj DLACZEGO, a nie CO.

### TypeScript
- Włączony tryb strict w `tsconfig.json`.
- Używaj JSDoc dla publicznych eksportów.
- Preferuj interfejsy zamiast aliasów typów dla typów obiektowych.
- Unikaj typu `any`; używaj generyków lub typów unii zamiast tego.

## Dokumentacja

- **README.md**: Przewodnik szybkiego startu, podstawowe przykłady użycia, instrukcje instalacji.
- **Dokumentacja API**: Dokumentuj wszystkie publiczne klasy, metody i właściwości wraz z przykładami.
- **Definicje typów**: W TypeScript wykorzystuj eksportowane typy. W Pythonie polegaj na podpowiedziach typów widocznych w podpowiedziach IDE.

## Przed wypchnięciem zmian (push)

- Uruchom testy i upewnij się, że przechodzą.
- Uruchom sprawdzanie typów (`mypy` dla Python, `tsc` dla TypeScript).
- Uruchom linter, jeśli jest skonfigurowany.
- Pisz jasne komunikaty commitów wyjaśniające zmianę i jej motywację.
