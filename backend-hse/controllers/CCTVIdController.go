package controllers

import (
	"backend/config"
	"backend/models"
	"encoding/json"
	"net/http"
	"sort"
	"strconv"

	"github.com/gorilla/mux"
)

// =====================================
// GET ID TERKECIL YANG KOSONG
// =====================================

func getNextAvailableID() (uint, error) {

	var ids []uint

	if err := config.DB.
		Model(&models.IDCCTVModels{}).
		Pluck("id", &ids).
		Error; err != nil {

		return 0, err
	}


	sort.Slice(ids, func(i, j int) bool {
		return ids[i] < ids[j]
	})


	nextID := uint(1)


	for _, id := range ids {

		if id == nextID {

			nextID++

		} else if id > nextID {

			break

		}

	}


	return nextID, nil
}



// =====================================
// GET ALL CCTV
// =====================================

func GetAllCCTV(
	w http.ResponseWriter,
	r *http.Request,
) {


	var cctvs []models.IDCCTVModels


	if err := config.DB.
		Find(&cctvs).
		Error; err != nil {


		http.Error(
			w,
			err.Error(),
			500,
		)

		return
	}


	json.NewEncoder(w).
		Encode(cctvs)

}




// =====================================
// GET CCTV BY ID
// =====================================

func GetCCTVByID(
	w http.ResponseWriter,
	r *http.Request,
) {


	id, _ := strconv.Atoi(
		mux.Vars(r)["id"],
	)


	var cctv models.IDCCTVModels


	if err := config.DB.
		First(&cctv,id).
		Error; err != nil {


		http.Error(
			w,
			"CCTV not found",
			404,
		)

		return
	}



	json.NewEncoder(w).
		Encode(cctv)

}




// =====================================
// CREATE CCTV
// =====================================

func CreateCCTV(
	w http.ResponseWriter,
	r *http.Request,
) {


	var cctv models.IDCCTVModels



	if err := json.NewDecoder(r.Body).
		Decode(&cctv); err != nil {


		http.Error(
			w,
			err.Error(),
			400,
		)

		return
	}



	// ID otomatis
	nextID, err := getNextAvailableID()


	if err != nil {

		http.Error(
			w,
			err.Error(),
			500,
		)

		return
	}


	cctv.ID = nextID



	// ==========================
	// DEFAULT KONDISI CCTV
	// ==========================

	if cctv.Kondisi == "" {

		cctv.Kondisi = "ON"

	}



	// SIMPAN

	if err := config.DB.
		Create(&cctv).
		Error; err != nil {


		http.Error(
			w,
			err.Error(),
			500,
		)

		return
	}



	// update statistik

	_ = cctv.RecalculateStats()



	json.NewEncoder(w).
		Encode(
			map[string]interface{}{

				"message":
					"CCTV created successfully",

				"data":
					cctv,

			},
		)

}





// =====================================
// UPDATE CCTV
// =====================================

// =====================================
// UPDATE CCTV
// =====================================

func UpdateCCTV(
	w http.ResponseWriter,
	r *http.Request,
) {

	id, _ := strconv.Atoi(
		mux.Vars(r)["id"],
	)


	var oldCCTV models.IDCCTVModels


	if err := config.DB.
		First(&oldCCTV, id).
		Error; err != nil {

		http.Error(
			w,
			"CCTV not found",
			404,
		)

		return
	}



	var cctv models.IDCCTVModels


	if err := json.NewDecoder(r.Body).
		Decode(&cctv); err != nil {

		http.Error(
			w,
			err.Error(),
			400,
		)

		return
	}



	// ==========================
	// HITUNG KONDISI CCTV
	// ==========================

	if oldCCTV.Kondisi == "DILEPAS" {

		cctv.Kondisi = "DILEPAS"

	} else {

		if cctv.JumlahError > cctv.JumlahOnKembali {

			cctv.Kondisi = "OFF"

		} else {

			cctv.Kondisi = "ON"

		}
	}



	// ==========================
	// UPDATE TANPA MENYENTUH
	// CREATED_AT
	// ==========================

	err := config.DB.
		Model(&models.IDCCTVModels{}).
		Where("id = ?", id).
		Updates(map[string]interface{}{

			"id_camera": cctv.IDCamera,

			"id_nvr": cctv.IDNVR,

			"lokasi": cctv.Lokasi,

			"area": cctv.Area,

			"kondisi": cctv.Kondisi,

			"jumlah_error": cctv.JumlahError,

			"jumlah_request": cctv.JumlahRequest,

			"jumlah_on_kembali": cctv.JumlahOnKembali,

			"jumlah_durasi_error": cctv.JumlahDurasiError,

			"average_durasi_x_error": cctv.AverageDurasiXError,

		}).
		Error


	if err != nil {

		http.Error(
			w,
			err.Error(),
			500,
		)

		return

	}



	// ==========================
	// HITUNG ULANG STATISTIK
	// ==========================

	oldCCTV.IDCamera = cctv.IDCamera

	_ = oldCCTV.RecalculateStats()



	// ambil data terbaru
	config.DB.
		First(&oldCCTV, id)



	json.NewEncoder(w).
		Encode(
			map[string]interface{}{

				"message":
					"CCTV updated successfully",

				"data":
					oldCCTV,

			},
		)

}





// =====================================
// DELETE CCTV
// =====================================

func DeleteCCTV(
	w http.ResponseWriter,
	r *http.Request,
) {


	id,_ :=
		strconv.Atoi(
			mux.Vars(r)["id"],
		)



	if err := config.DB.
		Unscoped().
		Delete(
			&models.IDCCTVModels{},
			id,
		).
		Error; err != nil {


		http.Error(
			w,
			err.Error(),
			500,
		)

		return
	}




	json.NewEncoder(w).
		Encode(
			map[string]string{

				"message":
					"CCTV deleted successfully",

			},
		)

}




// =====================================
// TROUBLE CAMERA PER AREA
// =====================================

type TroubleCameraArea struct {

	Area string `json:"area"`

	TotalCamera int64 `json:"total_camera"`

}



func GetTroubleCameraPerArea(
	w http.ResponseWriter,
	r *http.Request,
) {


	var result []TroubleCameraArea



	err := config.DB.
		Table("list_camera_trouble t").
		Select(`
			c.area,
			COUNT(DISTINCT t.id_camera) AS total_camera
		`).
		Joins(`
			JOIN id_cctv c
			ON c.id_camera = t.id_camera
		`).
		Group(
			"c.area",
		).
		Order(
			"total_camera DESC",
		).
		Scan(
			&result,
		).
		Error




	if err != nil {


		http.Error(
			w,
			err.Error(),
			500,
		)

		return
	}




	w.Header().
		Set(
			"Content-Type",
			"application/json",
		)



	json.NewEncoder(w).
		Encode(result)

}