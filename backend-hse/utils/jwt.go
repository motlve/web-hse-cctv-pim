package utils

import (
	"errors"
	"log"
	"os"
	"time"

	"github.com/golang-jwt/jwt/v4"
	"github.com/joho/godotenv"
)
var jwtSecret []byte

func init() {

	// Load .env jika ada (development)
	// Jika tidak ada, gunakan environment Docker/VPS
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using environment variables")
	}

	jwtSecret = []byte(os.Getenv("JWT_SECRET"))

	if len(jwtSecret) == 0 {
		panic("JWT_SECRET env variable is not set")
	}
}

func GenerateJWTToken(username string) (string, error) {
	claims := jwt.MapClaims{
		"username": username,
		"exp":      time.Now().Add(30 * 24 * time.Hour).Unix(),
		"iat":      time.Now().Unix(),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(jwtSecret)
}

func ValidateJWTToken(tokenString string) (*jwt.Token, error) {
	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, errors.New("unexpected signing method")
		}
		return jwtSecret, nil
	})

	if err != nil {
		var ve *jwt.ValidationError
		if errors.As(err, &ve) && ve.Errors&jwt.ValidationErrorExpired != 0 {
			return nil, errors.New("token expired")
		}
		return nil, err
	}

	if !token.Valid {
		return nil, errors.New("invalid token")
	}

	return token, nil
}
