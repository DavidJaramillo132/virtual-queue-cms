package main

import (
	"fmt"
	"os"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

var jwtKey = []byte("clave_super_segura")    // Debe coincidir EXACTAMENTE con auth.go
var refreshKey = []byte("clave_refresh_larga")

// Genera JWT de 15 minutos
func GenerarJWT(userID, rol string) (string, error) {
	claims := jwt.MapClaims{
		"user_id": userID,
		"rol":     rol,
		"exp":     jwt.NewNumericDate(time.Now().Add(15 * time.Minute)),
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(jwtKey)
}

// Genera refresh token de 7 días
func GenerarRefreshToken(userID string) (string, error) {
	claims := jwt.MapClaims{
		"user_id": userID,
		"exp":     jwt.NewNumericDate(time.Now().Add(7 * 24 * time.Hour)),
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(refreshKey)
}

func main() {
	// Argumentos opcionales: ./generate_jwt <userID> <rol>
	userID := "cliente1"
	rol := "cliente"

	if len(os.Args) > 1 {
		userID = os.Args[1]
	}
	if len(os.Args) > 2 {
		rol = os.Args[2]
	}

	jwtToken, err := GenerarJWT(userID, rol)
	if err != nil {
		fmt.Println("Error generando JWT:", err)
		return
	}

	refreshToken, err := GenerarRefreshToken(userID)
	if err != nil {
		fmt.Println("Error generando refresh token:", err)
		return
	}

	fmt.Println("🔑 JWT:", jwtToken)
	fmt.Println("🔄 Refresh token:", refreshToken)
}
