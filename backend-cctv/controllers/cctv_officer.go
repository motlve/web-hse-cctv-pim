package controllers

import (
	"backend/config"
	"backend/middlewares"
	"backend/models"
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"time"

	"github.com/gorilla/mux"
)

// ================================
// GET ALL OFFICER
// ================================

func GetAllOfficer(
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
		"Request by:",
		username,
	)



	name :=
		r.URL.Query().Get("name")



	var officers []models.OfficerModels

	var err error



	if name != "" {


		officers, err =
			models.GetOfficersByName(
				config.DB,
				name,
			)


	} else {


		officers, err =
			models.GetAllOfficers(
				config.DB,
			)

	}



	if err != nil {


		http.Error(
			w,
			"Gagal mengambil data petugas",
			http.StatusInternalServerError,
		)

		return

	}



	w.Header().Set(
		"Content-Type",
		"application/json",
	)


	json.NewEncoder(w).Encode(
		officers,
	)

}



// ================================
// CREATE OFFICER
// ================================

func CreateOfficer(
	w http.ResponseWriter,
	r *http.Request,
) {


	var officer models.OfficerModels


	err := json.NewDecoder(r.Body).
		Decode(&officer)


	if err != nil {

		http.Error(
			w,
			"Data tidak valid",
			400,
		)

		return
	}



	if officer.Status == "" {

		officer.Status = "Aktif"

	}



	err =
		models.CreateOfficer(
			config.DB,
			&officer,
		)


	if err != nil {

		http.Error(
			w,
			"Gagal membuat petugas",
			500,
		)

		return
	}



	json.NewEncoder(w).
		Encode(officer)

}




// ================================
// UPDATE DATA OFFICER
// ================================

func UpdateOfficer(
	w http.ResponseWriter,
	r *http.Request,
) {


	id, err :=
		strconv.Atoi(
			mux.Vars(r)["id"],
		)


	if err != nil {

		http.Error(
			w,
			"ID tidak valid",
			400,
		)

		return
	}



	var req models.OfficerModels


	err =
		json.NewDecoder(r.Body).
			Decode(&req)



	if err != nil {

		http.Error(
			w,
			"Body tidak valid",
			400,
		)

		return
	}




	err =
		config.DB.
			Model(&models.OfficerModels{}).
			Where(
				"id = ?",
				id,
			).
			Updates(
				map[string]interface{}{

					"name_officer":
						req.NameOfficer,

					"gender":
						req.Gender,

					"role":
						req.Role,

				},
			).
			Error



	if err != nil {

		fmt.Println(
			"ERROR UPDATE OFFICER:",
			err,
		)


		http.Error(
			w,
			"Gagal update data",
			500,
		)

		return
	}



	json.NewEncoder(w).
		Encode(
			map[string]string{

				"message":
					"Data officer berhasil diperbarui",

			},
		)

}





// ================================
// UPDATE STATUS OFFICER
// Aktif / Mutasi / Resign
// ================================

func UpdateStatusOfficer(
	w http.ResponseWriter,
	r *http.Request,
) {


	id, err :=
		strconv.Atoi(
			mux.Vars(r)["id"],
		)



	if err != nil {

		http.Error(
			w,
			"ID tidak valid",
			400,
		)

		return
	}



	var request struct {

		Status string `json:"status"`

	}



	err =
		json.NewDecoder(r.Body).
			Decode(&request)



	if err != nil {

		http.Error(
			w,
			"Data status tidak valid",
			400,
		)

		return
	}



	if request.Status == "" {

		http.Error(
			w,
			"Status wajib diisi",
			400,
		)

		return
	}



	if request.Status != "Aktif" &&
		request.Status != "Mutasi" &&
		request.Status != "Resign" {


		http.Error(
			w,
			"Status hanya Aktif, Mutasi, Resign",
			400,
		)

		return
	}



	err =
		config.DB.
			Model(
				&models.OfficerModels{},
			).
			Where(
				"id = ?",
				id,
			).
			Updates(
				map[string]interface{}{

					"status":
						request.Status,

					"tanggal_status":
						time.Now(),

				},
			).
			Error



	if err != nil {

		fmt.Println(
			"ERROR UPDATE STATUS:",
			err,
		)


		http.Error(
			w,
			"Gagal update status",
			500,
		)

		return
	}



	json.NewEncoder(w).
		Encode(
			map[string]interface{}{

				"message":
					"Status officer berhasil diubah",

				"status":
					request.Status,

			},
		)

}





// ================================
// DELETE OFFICER
// Soft Delete GORM
// ================================

func DeleteOfficer(
	w http.ResponseWriter,
	r *http.Request,
) {


	id, err :=
		strconv.Atoi(
			mux.Vars(r)["id"],
		)


	if err != nil {

		http.Error(
			w,
			"ID tidak valid",
			400,
		)

		return
	}



	err =
		config.DB.
			Delete(
				&models.OfficerModels{},
				id,
			).
			Error



	if err != nil {

		fmt.Println(
			"ERROR DELETE OFFICER:",
			err,
		)


		http.Error(
			w,
			"Gagal menghapus petugas",
			500,
		)

		return
	}



	json.NewEncoder(w).
		Encode(
			map[string]string{

				"message":
					"Petugas berhasil dihapus",

			},
		)

}