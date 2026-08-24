package controllers

import (
	"encoding/json"
	"net/http"
)

// DashboardHandler menampilkan data dashboard (contoh)
func DashboardHandler(w http.ResponseWriter, r *http.Request) {
	response := map[string]string{
		"message": "Dashboard berhasil diakses",
	}
	json.NewEncoder(w).Encode(response)
}
