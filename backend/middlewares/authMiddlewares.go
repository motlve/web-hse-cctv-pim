package middlewares

import (
	"backend/utils"
	"context"
	"fmt"
	"github.com/dgrijalva/jwt-go"
	"net/http"
	"strings"
)

// Buat key unik untuk context
type contextKey string

const UsernameKey contextKey = "username"

func AuthMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		authHeader := r.Header.Get("Authorization")
		if authHeader == "" {
			http.Error(w, "Missing Authorization header", http.StatusUnauthorized)
			return
		}

		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			http.Error(w, "Invalid Authorization header format", http.StatusUnauthorized)
			return
		}

		tokenString := parts[1]

		// Validasi token
		token, err := utils.ValidateJWTToken(tokenString)
		if err != nil || !token.Valid {
			http.Error(w, "Invalid Token", http.StatusUnauthorized)
			return
		}

		// Ambil claims
		claims, ok := token.Claims.(jwt.MapClaims)
		if !ok {
			http.Error(w, "Invalid Token Claims", http.StatusUnauthorized)
			return
		}

		// Ambil claims
		claims, ok = token.Claims.(jwt.MapClaims)
		if !ok {
			http.Error(w, "Invalid Token Claims", http.StatusUnauthorized)
			return
		}

		// DEBUG: print seluruh claims
		fmt.Printf("Claims: %+v\n", claims)

		// Ambil username dari claims
		username, ok := claims["username"].(string)
		if !ok {
			http.Error(w, "Username not found in token", http.StatusUnauthorized)
			return
		}

		// Ambil username dari claims
		username, ok = claims["username"].(string)
		if !ok {
			http.Error(w, "Username not found in token", http.StatusUnauthorized)
			return
		}

		// Simpan username ke context
		ctx := context.WithValue(r.Context(), UsernameKey, username)

		// Teruskan request ke handler berikutnya
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}
