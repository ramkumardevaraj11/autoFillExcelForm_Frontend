import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-file-upload',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatFormFieldModule, MatInputModule, MatButtonModule],
  templateUrl: './file-upload.component.html',
  styleUrls: ['./file-upload.component.css']
})
export class FileUploadComponent {

  encounterPdfFile: File | null = null;
  aptpFormFile: File | null = null;

  http = inject(HttpClient);

  onEncounterPdfSelected(event: any) {
    this.encounterPdfFile = event.target.files[0];
  }

  onAptpFormSelected(event: any) {
    this.aptpFormFile = event.target.files[0];
  }

  uploadFiles() {
    if (this.encounterPdfFile && this.aptpFormFile) {
      const formData = new FormData();
      formData.append('encounter_pdf', this.encounterPdfFile);
      formData.append('aptp_form', this.aptpFormFile);

      this.http.post('http://localhost:8000/upload/', formData)
        .subscribe({
          next: (res: any) => {
            if (res && res.download_url) {
              this.downloadFile(res.download_url, res.extracted_name);
            } else {
              alert('Upload successful but no download URL provided');
            }
          },
          error: (err: any) => {
            console.error('Upload failed:', err);
            alert('Upload failed! Please try again.');
          }
        });
    } else {
      alert('Please select both files before uploading.');
    }
  }

  private downloadFile(downloadUrl: string, extractedName?: any) {
    if (!downloadUrl) {
      alert('Download URL is not available');
      return;
    }

    // Construct the full URL
    const fullUrl = `http://localhost:8000${downloadUrl}`;
    
    // Create a temporary anchor element to trigger download
    const link = document.createElement('a');
    link.href = fullUrl;
    
    // Generate filename with extracted name if available
    let filename = 'APTP_Completed_Form.xlsx';
    if (extractedName && extractedName.last_name && extractedName.first_name) {
      const lastName = extractedName.last_name;
      const firstName = extractedName.first_name;
      const initial = extractedName.initial ? `_${extractedName.initial}` : '';
      filename = `${lastName}_${firstName}${initial}_APTP_Form.xlsx`;
    }
    
    link.download = filename;
    link.target = '_blank';
    
    // Add to DOM, click, and remove
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Show success message with extracted name info
    let message = 'File downloaded successfully!';
    if (extractedName && extractedName.last_name && extractedName.first_name) {
      message += `\nPatient: ${extractedName.first_name} ${extractedName.last_name}`;
      if (extractedName.initial) {
        message += ` (${extractedName.initial})`;
      }
    }
    alert(message);
  }

}
