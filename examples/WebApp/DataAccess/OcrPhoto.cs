using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace DataAccess.Models;

public class OcrPhoto
{
    public int Id { get; set; }
    public long TelegramUserId { get; set; }
    public string FileId { get; set; }

    [Column("ExtractedText")] // Явное указание имени столбца
    public string ExtractedText { get; set; }

    [Column("ReceivedAt")] // Явное указание имени столбца
    public DateTime ReceivedAt { get; set; } = DateTime.UtcNow;
    public byte[] ImageData { get; set; }

    // Новые фиксированные поля:
    [Phone(ErrorMessage = "Введите корректный номер телефона")]
    public string? RepresentativePhone { get; set; }

    [EmailAddress(ErrorMessage = "Введите корректный email адрес")]
    public string? Email { get; set; }

    [RegularExpression(@"^[А-Яа-яA-Za-z\s\-]+$", ErrorMessage = "Город должен содержать только буквы")]
    [StringLength(100, ErrorMessage = "Слишком длинное название города")]
    public string? City { get; set; }

    [DataType(DataType.Date)]
    public DateTime? BirthDate { get; set; }

    public string? CarBrand { get; set; }
    public string? CarNumber { get; set; }

    public bool IsMarried { get; set; }
    public string? SpouseFullName { get; set; }
    public DateTime? SpouseBirthDate { get; set; }

    public bool HasChildren { get; set; }
    public int? ChildrenCount { get; set; }

    public List<ChildInfo> Children { get; set; } = new();
}

public class ChildInfo
{
    public int Id { get; set; }
    public string? Name { get; set; }
    public int? Age { get; set; }
    public DateTime? BirthDate { get; set; } // <-- добавь это поле

    // Внешний ключ
    public int OcrPhotoId { get; set; }
    [ForeignKey("OcrPhotoId")]
    public OcrPhoto OcrPhoto { get; set; }
}

 public class User
    {
        public int Id { get; set; }
        public string Email { get; set; } = null!;
        public string PasswordHash { get; set; } = null!;
    }