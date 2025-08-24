using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Identity;
using DataAccess.Models;
using System.Linq;
using Microsoft.EntityFrameworkCore;
using DataAccess;
namespace WebApplication1.Controllers
{
    public class AccountController : Controller
    {
        private readonly AppDbContext _context;
        public AccountController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public IActionResult Login(string returnUrl = null)
        {
            ViewBag.ReturnUrl = returnUrl;
            return View();
        }

        [HttpPost]
        public async Task<IActionResult> Login(string email, string password, string returnUrl = null)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == email);
            if (user == null)
            {
                ViewBag.Error = "Неверный email или пароль";
                return View();
            }
            var hasher = new PasswordHasher<User>();
            var result = hasher.VerifyHashedPassword(user, user.PasswordHash, password);
            if (result == PasswordVerificationResult.Success)
            {
                var claims = new[] { new Claim(ClaimTypes.Name, user.Email) };
                var identity = new ClaimsIdentity(claims, "Cookies");
                var principal = new ClaimsPrincipal(identity);
                await HttpContext.SignInAsync("Cookies", principal);
                if (!string.IsNullOrEmpty(returnUrl) && Url.IsLocalUrl(returnUrl))
                    return Redirect(returnUrl);
                return RedirectToAction("Index", "Home");
            }
            ViewBag.Error = "Неверный email или пароль";
            return View();
        }

        [HttpGet]
        public IActionResult Register()
        {
            return View();
        }

        [HttpPost]
        public async Task<IActionResult> Register(string email, string password, string password2)
        {
            if (password != password2)
            {
                ViewBag.Error = "Пароли не совпадают";
                return View();
            }
            if (_context.Users.Any(u => u.Email == email))
            {
                ViewBag.Error = "Пользователь с таким email уже существует";
                return View();
            }
            var user = new User { Email = email };
            var hasher = new PasswordHasher<User>();
            user.PasswordHash = hasher.HashPassword(user, password);
            _context.Users.Add(user);
            await _context.SaveChangesAsync();
            return RedirectToAction("Login");
        }

        [HttpGet]
        public async Task<IActionResult> Logout()
        {
            try
            {
                // Логируем информацию о пользователе перед выходом
                var userName = User.Identity?.Name ?? "Unknown";
                Console.WriteLine($"Logging out user: {userName}");
                
                await HttpContext.SignOutAsync("Cookies");
                
                Console.WriteLine("User signed out successfully");
                
                // Принудительно очищаем все куки
                Response.Cookies.Delete(".AspNetCore.Cookies");
                Response.Cookies.Delete(".AspNetCore.Cookies.Session");
                
                return RedirectToAction("Login");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error during logout: {ex.Message}");
                return RedirectToAction("Login");
            }
        }

        // Метод для создания тестового пользователя
        [HttpGet]
        public async Task<IActionResult> CreateTestUser()
        {
            if (!_context.Users.Any())
            {
                var hasher = new PasswordHasher<User>();
                var testUser = new User 
                { 
                    Email = "admin@test.com",
                    PasswordHash = hasher.HashPassword(new User(), "admin123")
                };
                _context.Users.Add(testUser);
                await _context.SaveChangesAsync();
                return Content("Тестовый пользователь создан: admin@test.com / admin123");
            }
            return Content("Пользователи уже существуют в базе данных");
        }
    }
} 