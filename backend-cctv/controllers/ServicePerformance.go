package controllers

import (
	"backend/config"
	"backend/models"
	"encoding/json"
	"net/http"
	"time"

	"github.com/gorilla/mux"
)

//
// ===================== GET ALL =====================
//

func GetAllServicePerformance(w http.ResponseWriter, r *http.Request) {

	var services []models.ServicePerformance

	if err := config.DB.
		Order("id DESC").
		Find(&services).Error; err != nil {

		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}


	w.Header().Set("Content-Type", "application/json")

	json.NewEncoder(w).Encode(services)
}


//
// ===================== GET BY ID =====================
//

func GetServicePerformanceByID(w http.ResponseWriter, r *http.Request) {

	id := mux.Vars(r)["id"]

	var service models.ServicePerformance


	if err := config.DB.
		Where("id = ?", id).
		First(&service).Error; err != nil {

		http.Error(w, "Data tidak ditemukan", http.StatusNotFound)
		return
	}


	w.Header().Set("Content-Type", "application/json")

	json.NewEncoder(w).Encode(service)
}


//
// ===================== STATUS OTOMATIS =====================
//

func generateServiceStatus(service *models.ServicePerformance) {


	// CCTV sudah normal kembali
	if service.TanggalBerfungsiKembali != nil {

		service.Status = "Selesai Perbaikan"

		return
	}


	// Sudah dibuat laporan maintenance
	if service.TanggalDilaporkan != nil {

		service.Status = "Request Perbaikan"

		return
	}


	// Ada gangguan tetapi belum dibuat laporan
	if !service.TanggalKerusakan.IsZero() {

		service.Status = "Belum Dilaporkan"

		return
	}


	service.Status = "Unknown"
}



//
// ===================== HITUNG DURASI =====================
//

func calculateRepairDuration(
	start time.Time,
	end *time.Time,
) int {


	if end == nil || end.IsZero() {

		return 0
	}


	if start.IsZero() {

		return 0
	}


	duration := end.Sub(start)


	return int(duration.Hours()/24)

}




//
// ===================== CREATE =====================
//

func CreateServicePerformance(w http.ResponseWriter, r *http.Request) {


	var input models.ServicePerformance


	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {

		http.Error(w, err.Error(), http.StatusBadRequest)

		return
	}



	// ==========================
	// STATUS OTOMATIS
	// ==========================

	generateServiceStatus(&input)



	// ==========================
	// HITUNG DURASI
	// ==========================

	if input.TanggalBerfungsiKembali != nil {

		input.TotalDurasiPerbaikan =
			calculateRepairDuration(
				input.TanggalKerusakan,
				input.TanggalBerfungsiKembali,
			)

	}



	now := time.Now()

	input.CreatedAt = now
	input.UpdatedAt = now



	if err := config.DB.Create(&input).Error; err != nil {

		http.Error(
			w,
			err.Error(),
			http.StatusInternalServerError,
		)

		return
	}



	w.Header().Set("Content-Type", "application/json")


	json.NewEncoder(w).Encode(map[string]interface{}{

		"message":"Service performance berhasil ditambahkan",

		"data":input,

	})
}




//
// ===================== UPDATE =====================
//

func UpdateServicePerformance(w http.ResponseWriter, r *http.Request){


	id := mux.Vars(r)["id"]



	var service models.ServicePerformance


	if err := config.DB.
		Where("id = ?",id).
		First(&service).Error; err != nil {


		http.Error(
			w,
			"Data tidak ditemukan",
			http.StatusNotFound,
		)

		return
	}



	var input models.ServicePerformance



	if err:=json.NewDecoder(r.Body).Decode(&input); err!=nil{


		http.Error(
			w,
			err.Error(),
			http.StatusBadRequest,
		)

		return
	}




	// update field

	service.Area = input.Area

	service.Perangkat = input.Perangkat

	service.TotalCameraAffected = input.TotalCameraAffected

	service.TanggalKerusakan = input.TanggalKerusakan

	service.TanggalDilaporkan = input.TanggalDilaporkan

	service.TanggalBerfungsiKembali = input.TanggalBerfungsiKembali

	service.Keterangan = input.Keterangan




	// ==========================
	// STATUS OTOMATIS
	// ==========================

	generateServiceStatus(&service)




	// ==========================
	// DURASI
	// ==========================

	service.TotalDurasiPerbaikan =
		calculateRepairDuration(
			service.TanggalKerusakan,
			service.TanggalBerfungsiKembali,
		)



	service.UpdatedAt=time.Now()



	if err:=config.DB.Save(&service).Error;err!=nil{


		http.Error(
			w,
			err.Error(),
			http.StatusInternalServerError,
		)

		return
	}



	w.Header().Set("Content-Type","application/json")


	json.NewEncoder(w).Encode(map[string]interface{}{

		"message":"Service performance berhasil diperbarui",

		"data":service,

	})

}




//
// ===================== DELETE =====================
//

func DeleteServicePerformance(w http.ResponseWriter,r *http.Request){


	id:=mux.Vars(r)["id"]



	var service models.ServicePerformance



	if err:=config.DB.
		Where("id=?",id).
		First(&service).Error;err!=nil{


		http.Error(
			w,
			"Data tidak ditemukan",
			http.StatusNotFound,
		)

		return
	}




	if err:=config.DB.Delete(&service).Error;err!=nil{


		http.Error(
			w,
			err.Error(),
			http.StatusInternalServerError,
		)

		return
	}




	w.Header().Set("Content-Type","application/json")


	json.NewEncoder(w).Encode(map[string]string{

		"message":"Service performance berhasil dihapus",

	})
}