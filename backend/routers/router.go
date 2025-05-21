package routers

import (
	"backend/controllers"
	"backend/middlewares"
	"net/http"
)

func SetupRouters() *http.ServeMux {
	mux := http.NewServeMux()

	mux.HandleFunc("api/login", controllers.Login)
	mux.Handle("api/dashboard", middle)
	mux.Handle("api/user", middlewares.AuthMiddleware(http.HandlerFunc(controllers.GetUserProfile)))

	return mux
}