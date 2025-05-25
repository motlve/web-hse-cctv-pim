package controllers

import (
	"backend/config"
	"backend/middlewares"
	"backend/models"
	"encoding/json"
	"net/http"
)



func GetUserProfile(w http.ResponseWriter, r *http.Request) {
    usernameVal := r.Context().Value(middlewares.UsernameKey)
    if usernameVal == nil {
        http.Error(w, "Username missing in context", http.StatusUnauthorized)
        return
    }
    username, ok := usernameVal.(string)
    if !ok {
        http.Error(w, "Username invalid in context", http.StatusUnauthorized)
        return
    }

    user, err := models.GetUserByUsername(config.DB, username) 
    if err != nil {
        http.Error(w, "User not found", http.StatusNotFound)
        return
    }

    json.NewEncoder(w).Encode(map[string]string{
        "fullname": user.Fullname,
        "role": user.Role,
    })
}
