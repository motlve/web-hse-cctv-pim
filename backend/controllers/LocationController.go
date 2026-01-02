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

func GetAllLocation(w http.ResponseWriter, r *http.Request) {
	username := r.Context().Value("username").(string)
	fmt.Println("Request made by user:", username)

	locations, err := models.GetAllLocations(config.DB) // perbaikan di sini
	if err != nil {
		http.Error(w, "Gagal membaca data location", http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(locations)
}

func CreateLocation(w http.ResponseWriter, r *http.Request) {
	var location models.LocationModels
	if err := json.NewDecoder(r.Body).Decode(&location); err != nil {
		http.Error(w, "Gagal membaca data location", http.StatusBadRequest)
		return
	}
	if err := models.CreateLocation(config.DB, &location); err != nil { // pakai config.DB
		http.Error(w, "Gagal membuat location", http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(location)
}

func UpdateLocation(w http.ResponseWriter, r *http.Request) {
	idStr := mux.Vars(r)["id"]
	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "ID location tidak valid", http.StatusBadRequest)
		return
	}

	var location models.LocationModels
	if err := json.NewDecoder(r.Body).Decode(&location); err != nil {
		http.Error(w, "Gagal membaca data location", http.StatusBadRequest)
		return
	}
	location.ID = uint(id)
	if err := models.UpdateLocation(config.DB, &location); err != nil { // pakai config.DB
		http.Error(w, "Gagal memperbarui location", http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func DeleteLocation(w http.ResponseWriter, r *http.Request) {
	idStr := mux.Vars(r)["id"]
	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "ID location tidak valid", http.StatusBadRequest)
		return
	}

	if err := models.DeleteLocation(config.DB, uint(id)); err != nil { // pakai config.DB
		http.Error(w, "Gagal menghapus location", http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}
