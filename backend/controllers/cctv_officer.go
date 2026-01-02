package controllers

import (
	"backend/config"
	"backend/models"
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"

	"github.com/gorilla/mux"
)

// GetAllOfficer mengambil semua data petugas dari database, dengan opsi filter berdasarkan nama.
func GetAllOfficer(w http.ResponseWriter, r *http.Request) {
	username := r.Context().Value("username").(string)
	fmt.Printf("Request made by user: %s to get all officers\n", username)

	// Mendapatkan parameter nama dari query string (opsional)
	name := r.URL.Query().Get("name")

	var officers []models.OfficerModels
	var err error

	// Jika ada parameter nama, filter berdasarkan nama
	if name != "" {
		officers, err = models.GetOfficersByName(config.DB, name)
		if err != nil {
			fmt.Printf("Error in GetOfficersByName: %v\n", err)
			http.Error(w, "Gagal membaca data petugas berdasarkan nama", http.StatusInternalServerError)
			return
		}
	} else {
		// Jika tidak ada parameter nama, ambil semua petugas
		officers, err = models.GetAllOfficers(config.DB)
		if err != nil {
			fmt.Printf("Error in GetAllOfficers: %v\n", err)
			http.Error(w, "Gagal membaca data petugas", http.StatusInternalServerError)
			return
		}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(officers)
}

func CreateOfficer(w http.ResponseWriter, r *http.Request) {
	var officer models.OfficerModels
	if err := json.NewDecoder(r.Body).Decode(&officer); err != nil {
		fmt.Printf("Error decoding officer data for Create: %v\n", err)
		http.Error(w, "Gagal membaca data petugas dari body permintaan", http.StatusBadRequest)
		return
	}

	if err := models.CreateOfficer(config.DB, &officer); err != nil {
		fmt.Printf("Error creating officer: %v\n", err)
		http.Error(w, "Gagal membuat petugas", http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(officer)
}

func UpdateOfficer(w http.ResponseWriter, r *http.Request) {
	idStr := mux.Vars(r)["id"]
	id, err := strconv.Atoi(idStr)
	if err != nil {
		fmt.Printf("Invalid officer ID for Update: %v\n", err)
		http.Error(w, "ID petugas tidak valid", http.StatusBadRequest)
		return
	}

	var officer models.OfficerModels
	if err := json.NewDecoder(r.Body).Decode(&officer); err != nil {
		fmt.Printf("Error decoding officer data for Update: %v\n", err)
		http.Error(w, "Gagal membaca data petugas dari body permintaan", http.StatusBadRequest)
		return
	}

	officer.ID = uint(id)

	if err := models.UpdateOfficer(config.DB, &officer); err != nil {
		fmt.Printf("Error updating officer %d: %v\n", id, err)
		http.Error(w, "Gagal memperbarui petugas", http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func DeleteOfficer(w http.ResponseWriter, r *http.Request) {
	idStr := mux.Vars(r)["id"]
	id, err := strconv.Atoi(idStr)
	if err != nil {
		fmt.Printf("Invalid officer ID for Delete: %v\n", err)
		http.Error(w, "ID petugas tidak valid", http.StatusBadRequest)
		return
	}

	if err := models.DeleteOfficer(config.DB, uint(id)); err != nil {
		fmt.Printf("Error deleting officer %d: %v\n", id, err)
		http.Error(w, "Gagal menghapus petugas", http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}