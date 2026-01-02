package main

import (
	"backend/config"
	"backend/middlewares"
	"backend/models"
	"backend/routers"
	"log"
	"net/http"
)

func main() {
	config.ConnectionDatabase()

	// 1️⃣ Auto migrate semua model
	err := config.DB.AutoMigrate(
		&models.User{},
		&models.IncidentRecord{},
		&models.CategoryModels{},
		&models.OfficerModels{},
		&models.LocationModels{},
		&models.ListCameraTrouble{},
		&models.IDCCTVModels{},
		&models.SummaryRequestCamera{},
	)
	if err != nil {
		log.Fatalf("Failed to auto migrate database: %v", err)
	}
	log.Println("Database migration completed successfully.")

	// 2️⃣ Jalankan seed user di sini (sebelum server start)
	models.SeedDefaultUsers(config.DB)

	// 3️⃣ Siapkan router dan middleware
	mux := routers.SetupRouters()
	handler := middlewares.CorsMiddlewares(mux)

	// 4️⃣ Jalankan server
	log.Println("Server running on :8081")
	if err := http.ListenAndServe(":8081", handler); err != nil {
		log.Fatal(err)
	}
}
