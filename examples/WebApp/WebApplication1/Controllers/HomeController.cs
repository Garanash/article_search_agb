using DataAccess;
using DataAccess.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Npgsql;
using System.Globalization;
using System.Text.RegularExpressions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Newtonsoft.Json;

namespace WebApplication1.Controllers
{
    [Authorize]
    public class HomeController : Controller
    {
        private readonly AppDbContext _context;
        private readonly ILogger<HomeController> _logger;

        public HomeController(AppDbContext context, ILogger<HomeController> logger)
        {
            _context = context;
            _logger = logger;
        }

        /// <summary>
        /// Получает список людей с днями рождения на указанную дату
        /// </summary>
        private async Task<List<OcrPhoto>> GetBirthdaysForDateAsync(DateTime date)
        {
            return await _context.OcrPhotos
                .Include(p => p.Children)
                .Where(p => 
                    (p.BirthDate.HasValue && p.BirthDate.Value.Day == date.Day && p.BirthDate.Value.Month == date.Month) ||
                    (p.SpouseBirthDate.HasValue && p.SpouseBirthDate.Value.Day == date.Day && p.SpouseBirthDate.Value.Month == date.Month) ||
                    p.Children.Any(c => c.BirthDate.HasValue && c.BirthDate.Value.Day == date.Day && c.BirthDate.Value.Month == date.Month)
                )
                .ToListAsync();
        }

        /// <summary>
        /// Получает список людей с днями рождения в указанном месяце
        /// </summary>
        private async Task<List<OcrPhoto>> GetBirthdaysForMonthAsync(int year, int month)
        {
            return await _context.OcrPhotos
                .Include(p => p.Children)
                .Where(p => 
                    (p.BirthDate.HasValue && p.BirthDate.Value.Month == month) ||
                    (p.SpouseBirthDate.HasValue && p.SpouseBirthDate.Value.Month == month) ||
                    p.Children.Any(c => c.BirthDate.HasValue && c.BirthDate.Value.Month == month)
                )
                .ToListAsync();
        }

        public async Task<IActionResult> Index(string sortOrder, string searchString, int page = 1, int pageSize = 10, int calendarYear = 0, int calendarMonth = 0)
        {
            _logger.LogInformation($"Index method called with page={page}, searchString={searchString}, calendarYear={calendarYear}, calendarMonth={calendarMonth}");
            ViewData["CurrentFilter"] = searchString;

            // Настройка параметров сортировки
            ViewData["sortOrder"] = sortOrder;

            // Берём все записи с детьми (Include)
            var photos = _context.OcrPhotos.Include(p => p.Children).AsQueryable();

            if (!string.IsNullOrEmpty(searchString))
            {
                string[] dateFormats = { "dd.MM.yyyy", "d.M.yyyy", "dd.MM", "d.M" };
                if (int.TryParse(searchString, out int year) && searchString.Length == 4)
                {
                    // Поиск по году
                    photos = photos.Where(p =>
                        (p.BirthDate.HasValue && p.BirthDate.Value.Year == year) ||
                        (p.SpouseBirthDate.HasValue && p.SpouseBirthDate.Value.Year == year) ||

                        p.Children.Any(c => c.BirthDate.HasValue && c.BirthDate.Value.Year == year)
                    );
                }
                else if (DateTime.TryParseExact(searchString, dateFormats, CultureInfo.InvariantCulture, DateTimeStyles.None, out var parsedDate))
                {
                    // Конвертируем в UTC для PostgreSQL
                    var utcParsedDate = DateTime.SpecifyKind(parsedDate, DateTimeKind.Utc);
                    
                    if (searchString.Count(c => c == '.') == 2)
                    {
                        // Поиск по полной дате
                        photos = photos.Where(p =>
                            (p.BirthDate.HasValue && p.BirthDate.Value.Date == utcParsedDate.Date) ||
                            (p.SpouseBirthDate.HasValue && p.SpouseBirthDate.Value.Date == utcParsedDate.Date) ||

                            p.Children.Any(c => c.BirthDate.HasValue && c.BirthDate.Value.Date == utcParsedDate.Date)
                        );
                    }
                    else if (searchString.Count(c => c == '.') == 1)
                    {
                        int day = utcParsedDate.Day;
                        int month = utcParsedDate.Month;
                        photos = photos.Where(p =>
                            (p.BirthDate.HasValue && p.BirthDate.Value.Day == day && p.BirthDate.Value.Month == month) ||
                            (p.SpouseBirthDate.HasValue && p.SpouseBirthDate.Value.Day == day && p.SpouseBirthDate.Value.Month == month) ||

                            p.Children.Any(c => c.BirthDate.HasValue && c.BirthDate.Value.Day == day && c.BirthDate.Value.Month == month)
                        );
                    }
                }
                else
                {
                    // Поиск по текстовым полям и другим числовым параметрам
                    photos = photos.Where(p =>
                        p.Id.ToString().Contains(searchString) ||

                        (p.ExtractedText != null && p.ExtractedText.Contains(searchString)) ||
                        (p.City != null && p.City.Contains(searchString)) ||
                        (p.RepresentativePhone != null && p.RepresentativePhone.Contains(searchString)) ||
                        (p.Email != null && p.Email.Contains(searchString)) ||
                        (p.CarBrand != null && p.CarBrand.Contains(searchString)) ||
                        (p.CarNumber != null && p.CarNumber.Contains(searchString)) ||
                        (p.SpouseFullName != null && p.SpouseFullName.Contains(searchString)) ||
                        (p.ChildrenCount != null && p.ChildrenCount.ToString().Contains(searchString))
                    );
                }
            }

            // Сортировка
            photos = sortOrder switch
            {
                "Id" => photos.OrderBy(p => p.Id),
                "Id_desc" => photos.OrderByDescending(p => p.Id),

                "ExtractedText" => photos.OrderBy(p => p.ExtractedText),
                "ExtractedText_desc" => photos.OrderByDescending(p => p.ExtractedText),
                "City" => photos.OrderBy(p => p.City),
                "City_desc" => photos.OrderByDescending(p => p.City),
                "RepresentativePhone" => photos.OrderBy(p => p.RepresentativePhone),
                "RepresentativePhone_desc" => photos.OrderByDescending(p => p.RepresentativePhone),
                "Email" => photos.OrderBy(p => p.Email),
                "Email_desc" => photos.OrderByDescending(p => p.Email),
                "BirthDate" => photos.OrderBy(p => p.BirthDate),
                "BirthDate_desc" => photos.OrderByDescending(p => p.BirthDate),

                "CarBrand" => photos.OrderBy(p => p.CarBrand),
                "CarBrand_desc" => photos.OrderByDescending(p => p.CarBrand),
                "CarNumber" => photos.OrderBy(p => p.CarNumber),
                "CarNumber_desc" => photos.OrderByDescending(p => p.CarNumber),
                "IsMarried" => photos.OrderBy(p => p.IsMarried),
                "IsMarried_desc" => photos.OrderByDescending(p => p.IsMarried),
                "SpouseFullName" => photos.OrderBy(p => p.SpouseFullName),
                "SpouseFullName_desc" => photos.OrderByDescending(p => p.SpouseFullName),
                "HasChildren" => photos.OrderBy(p => p.HasChildren),
                "HasChildren_desc" => photos.OrderByDescending(p => p.HasChildren),
                "ChildrenCount" => photos.OrderBy(p => p.ChildrenCount),
                "ChildrenCount_desc" => photos.OrderByDescending(p => p.ChildrenCount),
                "ChildName" => photos.OrderBy(p => p.Children.OrderBy(c => c.Name).Select(c => c.Name).FirstOrDefault()),
                "ChildName_desc" => photos.OrderByDescending(p => p.Children.OrderBy(c => c.Name).Select(c => c.Name).FirstOrDefault()),
                "ChildAge" => photos.OrderBy(p => p.Children.OrderBy(c => c.Age).Select(c => c.Age).FirstOrDefault()),
                "ChildAge_desc" => photos.OrderByDescending(p => p.Children.OrderBy(c => c.Age).Select(c => c.Age).FirstOrDefault()),
                "ChildBirthDate" => photos.OrderBy(p => p.Children.OrderBy(c => c.BirthDate).Select(c => c.BirthDate).FirstOrDefault()),
                "ChildBirthDate_desc" => photos.OrderByDescending(p => p.Children.OrderBy(c => c.BirthDate).Select(c => c.BirthDate).FirstOrDefault()),
                "SpouseBirthDate" => photos.OrderBy(p => p.SpouseBirthDate),
                "SpouseBirthDate_desc" => photos.OrderByDescending(p => p.SpouseBirthDate),
                _ => photos.OrderBy(p => p.Id),
            };

            // Статистика по всей базе
            int totalCountAll = await _context.OcrPhotos.CountAsync();
            int withPhonesAll = await _context.OcrPhotos.CountAsync(x => !string.IsNullOrEmpty(x.RepresentativePhone));
            int withCitiesAll = await _context.OcrPhotos.CountAsync(x => !string.IsNullOrEmpty(x.City));
            int withChildrenAll = await _context.OcrPhotos.CountAsync(x => x.HasChildren);
            
            // Дни рождения на сегодня
            var today = DateTime.UtcNow; // Используем UTC для базы данных
            var todayBirthdays = await GetBirthdaysForDateAsync(today);
            
            // Данные для календаря
            var currentYear = calendarYear == 0 ? DateTime.UtcNow.Year : calendarYear;
            var currentMonth = calendarMonth == 0 ? DateTime.UtcNow.Month : calendarMonth;
            var startDate = new DateTime(currentYear, currentMonth, 1);
            var endDate = startDate.AddMonths(1).AddDays(-1);
            
            // Получаем все дни рождения в текущем месяце
            var monthBirthdays = await GetBirthdaysForMonthAsync(currentYear, currentMonth);
            

            // Пагинация
            int totalCount = await photos.CountAsync();
            var pagedPhotos = await photos
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();
            ViewBag.CurrentPage = page;
            ViewBag.PageSize = pageSize;
            ViewBag.TotalCount = totalCount;
            ViewBag.TotalCountAll = totalCountAll;
            ViewBag.WithPhonesAll = withPhonesAll;
            ViewBag.WithCitiesAll = withCitiesAll;
            ViewBag.WithChildrenAll = withChildrenAll;
            ViewBag.TodayBirthdays = todayBirthdays;
            ViewBag.MonthBirthdays = monthBirthdays;
            ViewBag.CurrentYear = currentYear;
            ViewBag.CurrentMonth = currentMonth;

            _logger.LogInformation($"[DB] Найдено записей после фильтрации: {totalCount}");
            foreach (var p in pagedPhotos)
            {
                _logger.LogDebug($"ID: {p.Id}, BirthDate: {p.BirthDate?.ToString("dd.MM.yyyy")}");
            }

            return View(pagedPhotos);
        }

        [HttpGet]
        public async Task<IActionResult> IndexPartial(string sortOrder, string searchString, int page = 1, int pageSize = 10)
        {
            _logger.LogInformation($"IndexPartial method called with page={page}, searchString={searchString}, sortOrder={sortOrder}");
            
            // Настройка параметров сортировки
            ViewData["sortOrder"] = sortOrder;
            ViewData["CurrentFilter"] = searchString;

            // Берём все записи с детьми (Include)
            var photos = _context.OcrPhotos.Include(p => p.Children).AsQueryable();

            if (!string.IsNullOrEmpty(searchString))
            {
                string[] dateFormats = { "dd.MM.yyyy", "d.M.yyyy", "dd.MM", "d.M" };
                if (int.TryParse(searchString, out int year) && searchString.Length == 4)
                {
                    // Поиск по году
                    photos = photos.Where(p =>
                        (p.BirthDate.HasValue && p.BirthDate.Value.Year == year) ||
                        (p.SpouseBirthDate.HasValue && p.SpouseBirthDate.Value.Year == year) ||
                        p.Children.Any(c => c.BirthDate.HasValue && c.BirthDate.Value.Year == year)
                    );
                }
                else if (DateTime.TryParseExact(searchString, dateFormats, CultureInfo.InvariantCulture, DateTimeStyles.None, out var parsedDate))
                {
                    // Конвертируем в UTC для PostgreSQL
                    var utcParsedDate = DateTime.SpecifyKind(parsedDate, DateTimeKind.Utc);
                    
                    if (searchString.Count(c => c == '.') == 2)
                    {
                        // Поиск по полной дате
                        photos = photos.Where(p =>
                            (p.BirthDate.HasValue && p.BirthDate.Value.Date == utcParsedDate.Date) ||
                            (p.SpouseBirthDate.HasValue && p.SpouseBirthDate.Value.Date == utcParsedDate.Date) ||
                            p.Children.Any(c => c.BirthDate.HasValue && c.BirthDate.Value.Date == utcParsedDate.Date)
                        );
                    }
                    else if (searchString.Count(c => c == '.') == 1)
                    {
                        int day = utcParsedDate.Day;
                        int month = utcParsedDate.Month;
                        photos = photos.Where(p =>
                            (p.BirthDate.HasValue && p.BirthDate.Value.Day == day && p.BirthDate.Value.Month == month) ||
                            (p.SpouseBirthDate.HasValue && p.SpouseBirthDate.Value.Day == day && p.SpouseBirthDate.Value.Month == month) ||
                            p.Children.Any(c => c.BirthDate.HasValue && c.BirthDate.Value.Day == day && c.BirthDate.Value.Month == month)
                        );
                    }
                }
                else
                {
                    // Поиск по тексту
                    photos = photos.Where(p =>
                        p.Id.ToString().Contains(searchString) ||
                        (p.ExtractedText != null && p.ExtractedText.Contains(searchString)) ||
                        (p.City != null && p.City.Contains(searchString)) ||
                        (p.RepresentativePhone != null && p.RepresentativePhone.Contains(searchString)) ||
                        (p.Email != null && p.Email.Contains(searchString)) ||
                        (p.CarBrand != null && p.CarBrand.Contains(searchString)) ||
                        (p.CarNumber != null && p.CarNumber.Contains(searchString)) ||
                        (p.SpouseFullName != null && p.SpouseFullName.Contains(searchString)) ||
                        p.Children.Any(c => c.Name != null && c.Name.Contains(searchString))
                    );
                }
            }

            // Сортировка
            photos = sortOrder switch
            {
                "Id" => photos.OrderBy(p => p.Id),
                "Id_desc" => photos.OrderByDescending(p => p.Id),
                "ExtractedText" => photos.OrderBy(p => p.ExtractedText),
                "ExtractedText_desc" => photos.OrderByDescending(p => p.ExtractedText),
                "City" => photos.OrderBy(p => p.City),
                "City_desc" => photos.OrderByDescending(p => p.City),
                "RepresentativePhone" => photos.OrderBy(p => p.RepresentativePhone),
                "RepresentativePhone_desc" => photos.OrderByDescending(p => p.RepresentativePhone),
                "Email" => photos.OrderBy(p => p.Email),
                "Email_desc" => photos.OrderByDescending(p => p.Email),
                "BirthDate" => photos.OrderBy(p => p.BirthDate),
                "BirthDate_desc" => photos.OrderByDescending(p => p.BirthDate),
                "CarBrand" => photos.OrderBy(p => p.CarBrand),
                "CarBrand_desc" => photos.OrderByDescending(p => p.CarBrand),
                "CarNumber" => photos.OrderBy(p => p.CarNumber),
                "CarNumber_desc" => photos.OrderByDescending(p => p.CarNumber),
                "IsMarried" => photos.OrderBy(p => p.IsMarried),
                "IsMarried_desc" => photos.OrderByDescending(p => p.IsMarried),
                "SpouseFullName" => photos.OrderBy(p => p.SpouseFullName),
                "SpouseFullName_desc" => photos.OrderByDescending(p => p.SpouseFullName),
                "SpouseBirthDate" => photos.OrderBy(p => p.SpouseBirthDate),
                "SpouseBirthDate_desc" => photos.OrderByDescending(p => p.SpouseBirthDate),
                "HasChildren" => photos.OrderBy(p => p.HasChildren),
                "HasChildren_desc" => photos.OrderByDescending(p => p.HasChildren),
                "ChildrenCount" => photos.OrderBy(p => p.ChildrenCount),
                "ChildrenCount_desc" => photos.OrderByDescending(p => p.ChildrenCount),
                "ChildName" => photos.OrderBy(p => p.Children.OrderBy(c => c.Name).Select(c => c.Name).FirstOrDefault()),
                "ChildName_desc" => photos.OrderByDescending(p => p.Children.OrderBy(c => c.Name).Select(c => c.Name).FirstOrDefault()),
                "ChildAge" => photos.OrderBy(p => p.Children.OrderBy(c => c.Age).Select(c => c.Age).FirstOrDefault()),
                "ChildAge_desc" => photos.OrderByDescending(p => p.Children.OrderBy(c => c.Age).Select(c => c.Age).FirstOrDefault()),
                "ChildBirthDate" => photos.OrderBy(p => p.Children.OrderBy(c => c.BirthDate).Select(c => c.BirthDate).FirstOrDefault()),
                "ChildBirthDate_desc" => photos.OrderByDescending(p => p.Children.OrderBy(c => c.BirthDate).Select(c => c.BirthDate).FirstOrDefault()),
                _ => photos.OrderBy(p => p.Id),
            };

            // Пагинация
            int totalCount = await photos.CountAsync();
            var pagedPhotos = await photos
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            ViewBag.CurrentPage = page;
            ViewBag.PageSize = pageSize;
            ViewBag.TotalCount = totalCount;
            ViewBag.TotalPages = (int)Math.Ceiling((double)totalCount / pageSize);

            return PartialView("_IndexPartial", pagedPhotos);
        }



        [HttpGet]
        public async Task<IActionResult> Details(int id)
        {
            _logger.LogInformation($"Trying to get details for photo ID: {id}");

            var photo = await _context.OcrPhotos
                .Include(p => p.Children)
                .FirstOrDefaultAsync(p => p.Id == id);

            if (photo == null)
            {
                _logger.LogWarning($"Photo with ID {id} not found");
                return NotFound();
            }

            return View(photo);
        }

        [HttpGet]
        public async Task<IActionResult> Calendar(int year = 0, int month = 0)
        {
            if (year == 0) year = DateTime.UtcNow.Year;
            if (month == 0) month = DateTime.UtcNow.Month;

            var startDate = new DateTime(year, month, 1);
            var endDate = startDate.AddMonths(1).AddDays(-1);

            // Получаем все дни рождения в текущем месяце
            var birthdays = await GetBirthdaysForMonthAsync(year, month);

            // Получаем дни рождения на сегодня
            var today = DateTime.UtcNow; // Используем UTC для базы данных
            var todayBirthdays = await GetBirthdaysForDateAsync(today);

            ViewBag.Year = year;
            ViewBag.Month = month;
            ViewBag.Birthdays = birthdays;
            ViewBag.TodayBirthdays = todayBirthdays;
            ViewBag.StartDate = startDate;
            ViewBag.EndDate = endDate;

            return View();
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> EditCustomFields(
    int id,
    string? RepresentativePhone,
    string? Email,
    string? City,
    DateTime? BirthDate,
    string? CarBrand,
    string? CarNumber,
    bool IsMarried,
    string? SpouseFullName,
    DateTime? SpouseBirthDate,
    bool HasChildren,
    int? ChildrenCount,
    List<ChildInfo> Children)
        {
            var photo = await _context.OcrPhotos
                .Include(p => p.Children)
                .FirstOrDefaultAsync(p => p.Id == id);

            if (photo == null) return NotFound();

            photo.RepresentativePhone = RepresentativePhone;
            photo.Email = Email;
            photo.City = City;
            photo.BirthDate = BirthDate.HasValue
                ? DateTime.SpecifyKind(BirthDate.Value, DateTimeKind.Utc)
                : null;
            photo.CarBrand = CarBrand;
            photo.CarNumber = CarNumber;
            photo.IsMarried = IsMarried;
            photo.SpouseFullName = IsMarried ? SpouseFullName : null;
            photo.SpouseBirthDate = IsMarried && SpouseBirthDate.HasValue
                ? DateTime.SpecifyKind(SpouseBirthDate.Value, DateTimeKind.Utc)
                : null;
            photo.HasChildren = HasChildren;
            photo.ChildrenCount = HasChildren ? ChildrenCount : null;

            // Обновляем детей
            photo.Children.Clear();
            if (HasChildren && Children != null)
            {
                foreach (var child in Children)
                {
                    if (!string.IsNullOrWhiteSpace(child.Name) || child.Age != null || child.BirthDate != null)
                    {
                        photo.Children.Add(new ChildInfo
                        {
                            Name = child.Name,
                            Age = child.Age,
                            BirthDate = child.BirthDate.HasValue
                                ? DateTime.SpecifyKind(child.BirthDate.Value, DateTimeKind.Utc)
                                : null
                        });
                    }
                }
            }

            await _context.SaveChangesAsync();
            TempData["SuccessMessage"] = "Данные обновлены";
            return RedirectToAction("Details", new { id });
        }

        public class ChildInfoApiDto
        {
            public string? Name { get; set; }
            public int? Age { get; set; }
            public DateTime? BirthDate { get; set; }
        }

        public class OcrPhotoApiDto
        {
            public long TelegramUserId { get; set; }
            public string FileId { get; set; }
            public string ExtractedText { get; set; }
            public string? ImageBase64 { get; set; }
            public string? RepresentativePhone { get; set; }
            public string? Email { get; set; }
            public string? City { get; set; }
            public DateTime? BirthDate { get; set; }
            public string? CarBrand { get; set; }
            public string? CarNumber { get; set; }
            public bool IsMarried { get; set; }
            public string? SpouseFullName { get; set; }
            public DateTime? SpouseBirthDate { get; set; }
            public bool HasChildren { get; set; }
            public int? ChildrenCount { get; set; }
            public List<ChildInfoApiDto>? Children { get; set; }
        }

        [HttpPost]
        [Route("api/ocrphoto")]
        [AllowAnonymous]
        [IgnoreAntiforgeryToken]
        public async Task<IActionResult> ApiAddOcrPhoto([FromBody] OcrPhotoApiDto dto)
        {
            _logger.LogInformation("ApiAddOcrPhoto called with FileId: " + dto?.FileId);
            _logger.LogInformation("DTO: " + JsonConvert.SerializeObject(dto));
            if (dto == null || string.IsNullOrEmpty(dto.FileId))
                return BadRequest("Некорректные данные");

            var ocrPhoto = await _context.OcrPhotos
                .Include(p => p.Children)
                .FirstOrDefaultAsync(p => p.FileId == dto.FileId);

            bool isUpdate = ocrPhoto != null;

            if (ocrPhoto == null)
            {
                if (string.IsNullOrEmpty(dto.ImageBase64))
                    return BadRequest("Для новой визитки требуется изображение");

                ocrPhoto = new OcrPhoto
                {
                    TelegramUserId = dto.TelegramUserId,
                    FileId = dto.FileId,
                    ExtractedText = dto.ExtractedText,
                    ReceivedAt = DateTime.UtcNow,
                    ImageData = Convert.FromBase64String(dto.ImageBase64),
                    RepresentativePhone = dto.RepresentativePhone,
                    Email = dto.Email,
                    City = dto.City,
                    BirthDate = dto.BirthDate.HasValue ? DateTime.SpecifyKind(dto.BirthDate.Value, DateTimeKind.Utc) : null,
                    CarBrand = dto.CarBrand,
                    CarNumber = dto.CarNumber,
                    IsMarried = dto.IsMarried,
                    SpouseFullName = dto.SpouseFullName,
                    SpouseBirthDate = dto.SpouseBirthDate.HasValue ? DateTime.SpecifyKind(dto.SpouseBirthDate.Value, DateTimeKind.Utc) : null,
                    HasChildren = dto.HasChildren,
                    ChildrenCount = dto.ChildrenCount,
                    Children = dto.Children?.Select(c => new ChildInfo
                    {
                        Name = c.Name,
                        Age = c.Age,
                        BirthDate = c.BirthDate.HasValue ? DateTime.SpecifyKind(c.BirthDate.Value, DateTimeKind.Utc) : null
                    }).ToList() ?? new List<ChildInfo>()
                };
                _context.OcrPhotos.Add(ocrPhoto);
            }
            else
            {
                ocrPhoto.ExtractedText = dto.ExtractedText ?? ocrPhoto.ExtractedText;
                if (!string.IsNullOrEmpty(dto.ImageBase64))
                    ocrPhoto.ImageData = Convert.FromBase64String(dto.ImageBase64);
                ocrPhoto.RepresentativePhone = dto.RepresentativePhone ?? ocrPhoto.RepresentativePhone;
                ocrPhoto.Email = dto.Email ?? ocrPhoto.Email;
                ocrPhoto.City = dto.City ?? ocrPhoto.City;
                ocrPhoto.BirthDate = dto.BirthDate.HasValue ? DateTime.SpecifyKind(dto.BirthDate.Value, DateTimeKind.Utc) : ocrPhoto.BirthDate;
                ocrPhoto.CarBrand = dto.CarBrand ?? ocrPhoto.CarBrand;
                ocrPhoto.CarNumber = dto.CarNumber ?? ocrPhoto.CarNumber;
                ocrPhoto.IsMarried = dto.IsMarried;
                ocrPhoto.SpouseFullName = dto.SpouseFullName ?? ocrPhoto.SpouseFullName;
                ocrPhoto.SpouseBirthDate = dto.SpouseBirthDate.HasValue ? DateTime.SpecifyKind(dto.SpouseBirthDate.Value, DateTimeKind.Utc) : ocrPhoto.SpouseBirthDate;
                ocrPhoto.HasChildren = dto.HasChildren;
                ocrPhoto.ChildrenCount = dto.ChildrenCount ?? ocrPhoto.ChildrenCount;

                ocrPhoto.Children.Clear();
                if (dto.Children != null)
                {
                    foreach (var child in dto.Children)
                    {
                        ocrPhoto.Children.Add(new ChildInfo
                        {
                            Name = child.Name,
                            Age = child.Age,
                            BirthDate = child.BirthDate.HasValue ? DateTime.SpecifyKind(child.BirthDate.Value, DateTimeKind.Utc) : null
                        });
                    }
                }
            }

            await _context.SaveChangesAsync();
            _logger.LogInformation("Saved OcrPhoto with ID: " + ocrPhoto.Id);

            // Возвращаем информацию о том, была ли запись обновлена
            return Ok(new { 
                ocrPhoto.Id, 
                IsUpdated = isUpdate,
                Message = isUpdate ? "Запись обновлена" : "Создана новая запись"
            });
        }

        public class OcrPhotoPatchDto
        {
            public string? RepresentativePhone { get; set; }
            public string? Email { get; set; }
            public string? City { get; set; }
            public DateTime? BirthDate { get; set; }
            public string? CarBrand { get; set; }
            public string? CarNumber { get; set; }
            public bool? IsMarried { get; set; }
            public string? SpouseFullName { get; set; }
            public DateTime? SpouseBirthDate { get; set; }
            public bool? HasChildren { get; set; }
            public int? ChildrenCount { get; set; }
            public List<ChildInfoApiDto>? Children { get; set; }
        }

        [HttpPatch("api/ocrphoto/{id}")]
        [AllowAnonymous]
        [IgnoreAntiforgeryToken]
        public async Task<IActionResult> PatchOcrPhoto(long id, [FromBody] OcrPhotoPatchDto patch)
        {
            var ocrPhoto = await _context.OcrPhotos
                .Include(p => p.Children)
                .FirstOrDefaultAsync(p => p.Id == id);

            if (ocrPhoto == null)
                return NotFound();

            // Обновляем только переданные поля
            if (patch.RepresentativePhone != null)
                ocrPhoto.RepresentativePhone = patch.RepresentativePhone;
            if (patch.Email != null)
                ocrPhoto.Email = patch.Email;
            if (patch.City != null)
                ocrPhoto.City = patch.City;
            if (patch.BirthDate != null)
                ocrPhoto.BirthDate = DateTime.SpecifyKind(patch.BirthDate.Value, DateTimeKind.Utc);
            if (patch.CarBrand != null)
                ocrPhoto.CarBrand = patch.CarBrand;
            if (patch.CarNumber != null)
                ocrPhoto.CarNumber = patch.CarNumber;
            if (patch.IsMarried.HasValue)
                ocrPhoto.IsMarried = patch.IsMarried.Value;
            if (patch.SpouseFullName != null)
                ocrPhoto.SpouseFullName = patch.SpouseFullName;
            if (patch.SpouseBirthDate != null)
                ocrPhoto.SpouseBirthDate = DateTime.SpecifyKind(patch.SpouseBirthDate.Value, DateTimeKind.Utc);
            if (patch.HasChildren.HasValue)
                ocrPhoto.HasChildren = patch.HasChildren.Value;
            if (patch.ChildrenCount.HasValue)
                ocrPhoto.ChildrenCount = patch.ChildrenCount.Value;

            // Обновление детей (если пришли)
            if (patch.Children != null)
            {
                ocrPhoto.Children.Clear();
                foreach (var child in patch.Children)
                {
                    ocrPhoto.Children.Add(new ChildInfo
                    {
                        Name = child.Name,
                        Age = child.Age,
                        BirthDate = child.BirthDate.HasValue ? DateTime.SpecifyKind(child.BirthDate.Value, DateTimeKind.Utc) : null
                    });
                }
            }

            await _context.SaveChangesAsync();
            return Ok(ocrPhoto);
        }
    }
}
