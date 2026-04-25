# Profile Backend Contract

The frontend profile page is wired to authenticated `/api/profile/me` endpoints. The auth interceptor already sends `Authorization: Bearer <accessToken>` for these requests.

## Required endpoints

### `GET /api/profile/me`

Return the currently authenticated user's profile. Do not require the frontend to pass a user id; derive the user from the JWT.

Expected response:

```json
{
  "id": 1,
  "firstName": "Ada",
  "lastName": "Lovelace",
  "name": "Ada Lovelace",
  "email": "ada@example.com",
  "phone": "+90 555 000 0000",
  "role": "USER",
  "address": {
    "street": "Example Street 1",
    "city": "Istanbul",
    "state": "",
    "zipCode": "34000",
    "country": "Turkey"
  },
  "preferences": {
    "theme": "dark",
    "notifications": true,
    "language": "English",
    "currency": "USD"
  }
}
```

### `PUT /api/profile/me`

Update editable profile fields for the currently authenticated user and return the saved profile in the same shape as `GET /api/profile/me`.

Request body can include any of:

```json
{
  "firstName": "Ada",
  "lastName": "Lovelace",
  "name": "Ada Lovelace",
  "email": "ada@example.com",
  "phone": "+90 555 000 0000",
  "address": {
    "street": "Example Street 1",
    "city": "Istanbul",
    "state": "",
    "zipCode": "34000",
    "country": "Turkey"
  },
  "preferences": {
    "theme": "dark",
    "notifications": true,
    "language": "English",
    "currency": "USD"
  }
}
```

### `PATCH /api/profile/me/preferences`

Update only profile preferences and return the full saved profile.

Request body:

```json
{
  "theme": "light",
  "notifications": false
}
```

## Important notes

- The frontend no longer creates fake profile emails like `username@example.com`.
- The frontend caches the last successfully loaded profile only as a fallback display. It does not treat localStorage as a successful save.
- The login response may optionally include `email`. The frontend stores `response.email || submittedLoginEmail`, plus `userId` from the existing login response.
- Return `401` for missing/invalid JWT, `400` for validation errors, and `409` if an updated email is already used by another account.
