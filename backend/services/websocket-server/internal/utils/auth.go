package utils

import (
	"errors"
	"os"

	"github.com/golang-jwt/jwt/v5"
)

// Usar la variable de entorno JWT_SECRET, con fallback
func getJWTKey() []byte {
	secret := os.Getenv("JWT_SECRET")
	if secret == "" {
		secret = "clave_super_segura" // fallback
	}
	return []byte(secret)
}


func ValidarJWT(tokenStr string) (map[string]interface{}, error) {
	token, err := jwt.ParseWithClaims(tokenStr, jwt.MapClaims{}, func(t *jwt.Token) (interface{}, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, errors.New("firma inválida")
		}
		return getJWTKey(), nil
	})
	if err != nil {
		return nil, err
	}

	if claims, ok := token.Claims.(jwt.MapClaims); ok && token.Valid {
		return claims, nil
	}

	return nil, errors.New("token inválido, validado")
}

// func ValidarRefreshToken(tokenStr string) (string, error) {
// 	token, err := jwt.ParseWithClaims(tokenStr, jwt.MapClaims{}, func(t *jwt.Token) (interface{}, error) {
// 		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
// 			return nil, errors.New("firma inválida")
// 		}
// 		return refreshKey, nil
// 	})
// 	if err != nil {
// 		return "", err
// 	}

// 	if claims, ok := token.Claims.(jwt.MapClaims); ok && token.Valid {
// 		userID, _ := claims["user_id"].(string)
// 		return userID, nil
// 	}

// 	return "", errors.New("refresh token inválido")
// }
