package controllers

import (
	"backend/config"
	"backend/models"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/gorilla/mux"
)

//
// ===================== HELPERS =====================
//

// Hitung jumlah hari request -> pemasangan
func calcProgressDays(request, pemasangan *time.Time) int {

	if request == nil || pemasangan == nil {
		return 0
	}

	if request.IsZero() || pemasangan.IsZero() {
		return 0
	}


	start := time.Date(
		request.Year(),
		request.Month(),
		request.Day(),
		0,
		0,
		0,
		0,
		time.Local,
	)


	end := time.Date(
		pemasangan.Year(),
		pemasangan.Month(),
		pemasangan.Day(),
		0,
		0,
		0,
		0,
		time.Local,
	)


	return int(end.Sub(start).Hours() / 24)

}



// Status otomatis
func determineStatus(pemasangan *time.Time) string {

	if pemasangan == nil {
		return "Request"
	}


	if pemasangan.IsZero() {
		return "Request"
	}


	return "Success"

}



// Cek apakah camera sudah ada di tabel id_cctv
func determineInputDatabase(idCamera string) string {

	fmt.Println("CEK CCTV:", idCamera)

	var count int64

	config.DB.
		Model(&models.IDCCTVModels{}).
		Where("id_camera = ?", idCamera).
		Count(&count)


	fmt.Println("HASIL:", count)


	if count > 0 {
		return "Terinput"
	}

	return "Belum Terinput"
}



//
// ===================== GET ALL =====================
//


func GetAllSummaryRequestCamera(
	w http.ResponseWriter,
	r *http.Request,
) {


	var summaries []models.SummaryRequestCamera


	if err := config.DB.
		Order("id DESC").
		Find(&summaries).Error; err != nil {


		http.Error(
			w,
			err.Error(),
			http.StatusInternalServerError,
		)

		return

	}



	for i := range summaries {


		summaries[i].ProgressDays =
			calcProgressDays(
				&summaries[i].TanggalRequest,
				summaries[i].TanggalPemasangan,
			)



		summaries[i].Status =
			determineStatus(
				summaries[i].TanggalPemasangan,
			)



		summaries[i].InputDatabase =
			determineInputDatabase(
				summaries[i].IDCamera,
			)


	}



	w.Header().Set(
		"Content-Type",
		"application/json",
	)


	json.NewEncoder(w).Encode(summaries)

}




//
// ===================== GET BY ID =====================
//


func GetSummaryRequestCameraByID(
	w http.ResponseWriter,
	r *http.Request,
) {


	id := mux.Vars(r)["id"]



	var summary models.SummaryRequestCamera



	if err := config.DB.
		Where("id = ?", id).
		First(&summary).Error; err != nil {


		http.Error(
			w,
			"Data tidak ditemukan",
			http.StatusNotFound,
		)


		return

	}



	summary.ProgressDays =
		calcProgressDays(
			&summary.TanggalRequest,
			summary.TanggalPemasangan,
		)



	summary.Status =
		determineStatus(
			summary.TanggalPemasangan,
		)



	summary.InputDatabase =
		determineInputDatabase(
			summary.IDCamera,
		)



	w.Header().Set(
		"Content-Type",
		"application/json",
	)



	json.NewEncoder(w).Encode(summary)


}




//
// ===================== CREATE =====================
//


func CreateSummaryRequestCamera(
	w http.ResponseWriter,
	r *http.Request,
) {


	var input models.SummaryRequestCamera



	if err := json.NewDecoder(r.Body).
		Decode(&input); err != nil {


		http.Error(
			w,
			err.Error(),
			http.StatusBadRequest,
		)

		return

	}



	if input.IDCamera == "" {


		http.Error(
			w,
			"ID Camera wajib diisi",
			http.StatusBadRequest,
		)

		return

	}



	if input.Lokasi == "" {


		http.Error(
			w,
			"Lokasi wajib diisi",
			http.StatusBadRequest,
		)

		return

	}




	// cek duplicate

	var exist models.SummaryRequestCamera


	if err := config.DB.
		Where(
			"id_camera = ?",
			input.IDCamera,
		).
		First(&exist).Error; err == nil {


		http.Error(
			w,
			"ID Camera sudah ada",
			http.StatusConflict,
		)

		return

	}



	now := time.Now()


	input.CreatedAt = now
	input.UpdatedAt = now



	// hitung realtime

	input.Status =
		determineStatus(
			input.TanggalPemasangan,
		)



	input.ProgressDays =
		calcProgressDays(
			&input.TanggalRequest,
			input.TanggalPemasangan,
		)



	input.InputDatabase =
		determineInputDatabase(
			input.IDCamera,
		)




	if err := config.DB.
		Create(&input).Error; err != nil {


		http.Error(
			w,
			err.Error(),
			http.StatusInternalServerError,
		)

		return

	}




	w.Header().Set(
		"Content-Type",
		"application/json",
	)



	json.NewEncoder(w).Encode(
		map[string]interface{}{
			"message":"Data berhasil ditambahkan",
			"data":input,
		},
	)


}





//
// ===================== UPDATE =====================
//


func UpdateSummaryRequestCamera(
	w http.ResponseWriter,
	r *http.Request,
) {


	id := mux.Vars(r)["id"]



	var summary models.SummaryRequestCamera



	if err := config.DB.
		Where(
			"id = ?",
			id,
		).
		First(&summary).Error; err != nil {


		http.Error(
			w,
			"Data tidak ditemukan",
			http.StatusNotFound,
		)


		return

	}




	var input models.SummaryRequestCamera



	if err := json.NewDecoder(r.Body).
		Decode(&input); err != nil {


		http.Error(
			w,
			err.Error(),
			http.StatusBadRequest,
		)


		return

	}




	// ID CAMERA TIDAK BOLEH BERUBAH

	summary.Lokasi =
		input.Lokasi


	summary.LokasiDetail =
		input.LokasiDetail


	summary.TanggalRequest =
		input.TanggalRequest


	summary.TanggalPemasangan =
		input.TanggalPemasangan


	summary.Keterangan =
		input.Keterangan




	summary.Status =
		determineStatus(
			summary.TanggalPemasangan,
		)



	summary.ProgressDays =
		calcProgressDays(
			&summary.TanggalRequest,
			summary.TanggalPemasangan,
		)



	summary.InputDatabase =
		determineInputDatabase(
			summary.IDCamera,
		)



	summary.UpdatedAt =
		time.Now()



	if err := config.DB.
		Save(&summary).Error; err != nil {


		http.Error(
			w,
			err.Error(),
			http.StatusInternalServerError,
		)


		return

	}



	json.NewEncoder(w).Encode(
		map[string]interface{}{
			"message":"Data berhasil diperbarui",
			"data":summary,
		},
	)


}





//
// ===================== DELETE =====================
//


func DeleteSummaryRequestCamera(
	w http.ResponseWriter,
	r *http.Request,
) {

fmt.Println("DELETE SUMMARY REQUEST CAMERA HIT")

	id := mux.Vars(r)["id"]

	fmt.Println("DELETE ID:", id)


	var summary models.SummaryRequestCamera


	result := config.DB.
		Where("id = ?", id).
		First(&summary)


	if result.Error != nil {

		fmt.Println("DELETE ERROR:", result.Error)

		http.Error(
			w,
			"Data tidak ditemukan",
			http.StatusNotFound,
		)

		return
	}


	fmt.Println("DATA FOUND:", summary.ID)


	if err := config.DB.
		Delete(&summary).Error; err != nil {


		fmt.Println("DELETE DB ERROR:", err)


		http.Error(
			w,
			err.Error(),
			http.StatusInternalServerError,
		)

		return
	}


	json.NewEncoder(w).Encode(
		map[string]string{
			"message":"Data berhasil dihapus",
		},
	)
}

// ===================== GET BELUM TERINPUT =====================

func GetUninputSummaryRequestCamera(
	w http.ResponseWriter,
	r *http.Request,
) {

	var summaries []models.SummaryRequestCamera


	if err := config.DB.
		Order("id DESC").
		Find(&summaries).Error; err != nil {

		http.Error(
			w,
			err.Error(),
			http.StatusInternalServerError,
		)

		return
	}



	// filter hanya yang belum masuk id_cctv

	var result []models.SummaryRequestCamera


	for i := range summaries {


		inputDB := determineInputDatabase(
			summaries[i].IDCamera,
		)


		if inputDB == "Belum Terinput" {


			summaries[i].InputDatabase = inputDB


			summaries[i].ProgressDays =
				calcProgressDays(
					&summaries[i].TanggalRequest,
					summaries[i].TanggalPemasangan,
				)


			summaries[i].Status =
				determineStatus(
					summaries[i].TanggalPemasangan,
				)


			result = append(
				result,
				summaries[i],
			)

		}

	}



	w.Header().Set(
		"Content-Type",
		"application/json",
	)


	json.NewEncoder(w).Encode(result)

}