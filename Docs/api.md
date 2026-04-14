{{base_url}}/admin/dashboard
{
    "success": true,
    "message": "Dashboard analytics fetched successfully",
    "data": {
        "users": {
            "total": 7,
            "patients": 1,
            "doctors": 5
        },
        "doctors": {
            "total": 5,
            "pending": 0,
            "approved": 5
        },
        "appointments": {
            "total": 14,
            "pending": 4,
            "approved": 2,
            "completed": 6,
            "cancelled": 1,
            "rejected": 1
        },
        "medicalRecords": {
            "total": 0
        },
        "reviews": {
            "total": 6,
            "averageRating": 4.7
        },
        "recentAppointments": [
            {
                "id": "35a345fb-2fd5-453b-9f07-5e13bf579791",
                "status": "PENDING",
                "scheduledAt": "2026-04-17T11:00:00.000Z",
                "createdAt": "2026-04-14T11:36:16.715Z",
                "patient": {
                    "firstName": "Ananya",
                    "lastName": "Patel"
                },
                "doctor": {
                    "firstName": "Vikram",
                    "lastName": "Patel",
                    "specializations": [
                        "Orthopaedics",
                        "Sports Medicine"
                    ]
                }
            },
            {
                "id": "a87a29fc-5f16-445d-b0cc-b0f4ecd87bf9",
                "status": "PENDING",
                "scheduledAt": "2026-04-17T10:00:00.000Z",
                "createdAt": "2026-04-14T11:22:35.461Z",
                "patient": {
                    "firstName": "Ananya",
                    "lastName": "Patel"
                },
                "doctor": {
                    "firstName": "Vikram",
                    "lastName": "Patel",
                    "specializations": [
                        "Orthopaedics",
                        "Sports Medicine"
                    ]
                }
            },
            {
                "id": "78587907-eefd-4c9c-a3fd-03a02fa2854b",
                "status": "CANCELLED",
                "scheduledAt": "2026-04-02T09:00:00.000Z",
                "createdAt": "2026-04-14T09:33:20.438Z",
                "patient": {
                    "firstName": "Ananya",
                    "lastName": "Patel"
                },
                "doctor": {
                    "firstName": "Vikram",
                    "lastName": "Patel",
                    "specializations": [
                        "Orthopaedics",
                        "Sports Medicine"
                    ]
                }
            },
            {
                "id": "d99faa3b-3919-4ba6-a5c8-ccc7e7931962",
                "status": "PENDING",
                "scheduledAt": "2026-04-21T14:00:00.000Z",
                "createdAt": "2026-04-14T09:33:20.430Z",
                "patient": {
                    "firstName": "Ananya",
                    "lastName": "Patel"
                },
                "doctor": {
                    "firstName": "Sunita",
                    "lastName": "Verma",
                    "specializations": [
                        "Gynaecology",
                        "Obstetrics"
                    ]
                }
            },
            {
                "id": "650d31e9-9167-4f48-a954-06a70f990924",
                "status": "PENDING",
                "scheduledAt": "2026-04-19T10:00:00.000Z",
                "createdAt": "2026-04-14T09:33:20.427Z",
                "patient": {
                    "firstName": "Ananya",
                    "lastName": "Patel"
                },
                "doctor": {
                    "firstName": "Arjun",
                    "lastName": "Mehta",
                    "specializations": [
                        "Neurology",
                        "Psychiatry"
                    ]
                }
            }
        ]
    },
    "errors": null
}
====================
