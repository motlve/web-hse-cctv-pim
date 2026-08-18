package controllers

import (
	"backend/config"
	"backend/middlewares"
	"backend/models"
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"

	"github.com/gorilla/mux"
)

func GetAllCategories(
	w http.ResponseWriter,
	r *http.Request,
) {


	usernameVal :=
		r.Context().Value(
			middlewares.UsernameKey,
		)


	username, ok :=
		usernameVal.(string)


	if !ok {

		http.Error(
			w,
			"Unauthorized",
			http.StatusUnauthorized,
		)

		return
	}



	fmt.Println(
		"Request made by user:",
		username,
	)



	categories, err :=
		models.GetAllCategories(
			config.DB,
		)



	if err != nil {

		http.Error(
			w,
			"Gagal membaca data kategori",
			http.StatusInternalServerError,
		)

		return
	}



	w.Header().Set(
		"Content-Type",
		"application/json",
	)


	json.NewEncoder(w).Encode(
		categories,
	)

}


func CreateCategory(w http.ResponseWriter, r *http.Request) {
	var category models.CategoryModels
	if err := json.NewDecoder(r.Body).Decode(&category); err != nil {
		http.Error(w, "Gagal membaca data kategori", http.StatusBadRequest)
		return
	}
	if err := models.CreateCategory(config.DB, &category); err != nil { // pakai config.DB
		http.Error(w, "Gagal membuat kategori", http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(category)
}

func UpdateCategory(w http.ResponseWriter, r *http.Request) {
	idStr := mux.Vars(r)["id"]
	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "ID kategori tidak valid", http.StatusBadRequest)
		return
	}

	var category models.CategoryModels
	if err := json.NewDecoder(r.Body).Decode(&category); err != nil {
		http.Error(w, "Gagal membaca data kategori", http.StatusBadRequest)
		return
	}
	category.ID = uint(id)
	if err := models.UpdateCategory(config.DB, &category); err != nil { // pakai config.DB
		http.Error(w, "Gagal memperbarui kategori", http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func DeleteCategory(w http.ResponseWriter, r *http.Request) {
	idStr := mux.Vars(r)["id"]
	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "ID kategori tidak valid", http.StatusBadRequest)
		return
	}

	if err := models.DeleteCategory(config.DB, uint(id)); err != nil { // pakai config.DB
		http.Error(w, "Gagal menghapus kategori", http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}
