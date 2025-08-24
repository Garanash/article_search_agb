using Microsoft.EntityFrameworkCore;
using DataAccess.Models;

namespace DataAccess
{
    public class AppDbContext : DbContext
    {
        // Добавляем конструктор с параметрами
        public AppDbContext(DbContextOptions<AppDbContext> options)
            : base(options)
        {
        }

        public DbSet<OcrPhoto> OcrPhotos { get; set; }
        public DbSet<ChildInfo> Children { get; set; }
        public DbSet<User> Users { get; set; }
        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<OcrPhoto>()
                .HasMany(p => p.Children)
                .WithOne(c => c.OcrPhoto)
                .HasForeignKey(c => c.OcrPhotoId)
                .OnDelete(DeleteBehavior.Cascade);
        }
    }
}