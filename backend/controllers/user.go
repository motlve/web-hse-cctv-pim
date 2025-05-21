package controllers

import (
	"backend/middlewares"
	"backend/models"
	"encoding/json"
	"net/http"
)

func GetUserProfile(w http.ResponseWriter, r *http.Request) {
	username := r.Context().Value(middlewares.UsernameKey).(string)

	user, err := models.GetUserByUsername(username)
	if err != nil {
		http.Error(w, "User not found", http.StatusNotFound)
		return
	}

	json.NewEncoder(w).Encode(map[string]string{
		"fullname": user.Fullname,
		"role": user.Role,
	})
}
