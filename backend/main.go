package main

import (
	"backend/config"
	"backend/middlewares"
	"backend/models"
	"fmt"
	"log"
	"net/http"

	"backend/controllers"

	"golang.org/x/crypto/bcrypt"
)

func hashPassword(password string) string {
	hashed, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		log.Fatal(err)
	}
	return string(hashed)
}

func seedUser() {
	var count int64
	config.DB.Model(&models.User{}).Count(&count)
	if count == 0 {
		users := []models.User{
			{
				Username: "Yudha",
				Password: hashPassword("managerhse001"),
				Role:     "Manager HSE",
			},
			{
				Username: "Aji",
				Password: hashPassword("hse001"),
				Role:     "HSE",
			},
			{
				Username: "Rizky",
				Password: hashPassword("cctv001"),
				Role:     "Petugas CCTV",
			},
		}
		for _, user := range users {
			config.DB.Create(&user)
		}
		fmt.Println("Seeded users to database")
	}
}

func main() {
	config.ConnectionDatabase()
	config.DB.AutoMigrate(&models.User{})

	seedUser()

	mux := http.NewServeMux()
	mux.HandleFunc("/api/login", controllers.Login)

	handler := middlewares.CorsMiddlewares(mux)

	log.Println("Server running on :8081")
	if err := http.ListenAndServe(":8081", handler); err != nil {
		log.Fatal(err)
	}

	
}
