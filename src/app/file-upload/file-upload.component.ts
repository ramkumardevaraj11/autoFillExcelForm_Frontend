import { CommonModule } from '@angular/common';
import { Component, inject, ViewChild, ElementRef } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-file-upload',
  standalone: true,
  imports: [
    CommonModule, 
    MatCardModule, 
    MatFormFieldModule, 
    MatInputModule, 
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule
  ],
  templateUrl: './file-upload.component.html',
  styleUrls: ['./file-upload.component.css']
})
export class FileUploadComponent {

  @ViewChild('encounterInput') encounterInput!: ElementRef<HTMLInputElement>;
  @ViewChild('aptpInput') aptpInput!: ElementRef<HTMLInputElement>;

  encounterPdfFile: File | null = null;
  aptpFormFile: File | null = null;
  isUploading = false;
  isDraggingEncounter = false;
  isDraggingAptp = false;

  http = inject(HttpClient);

  onEncounterPdfSelected(event: any) {
    const file = event.target.files[0];
    if (file && file.type === 'application/pdf') {
      this.encounterPdfFile = file;
    } else if (file) {
      alert('Please select a valid PDF file.');
    }
  }

  onAptpFormSelected(event: any) {
    const file = event.target.files[0];
    if (file && (file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
                 file.type === 'text/csv' || 
                 file.name.endsWith('.xlsx') || 
                 file.name.endsWith('.csv'))) {
      this.aptpFormFile = file;
    } else if (file) {
      alert('Please select a valid Excel (.xlsx) or CSV file.');
    }
  }

  triggerFileInput(type: 'encounter' | 'aptp') {
    if (type === 'encounter' && this.encounterInput) {
      this.encounterInput.nativeElement.click();
    } else if (type === 'aptp' && this.aptpInput) {
      this.aptpInput.nativeElement.click();
    }
  }

  onDragOver(event: DragEvent, type: 'encounter' | 'aptp') {
    event.preventDefault();
    event.stopPropagation();
    if (type === 'encounter') {
      this.isDraggingEncounter = true;
    } else {
      this.isDraggingAptp = true;
    }
  }

  onDragLeave(event: DragEvent, type: 'encounter' | 'aptp') {
    event.preventDefault();
    event.stopPropagation();
    if (type === 'encounter') {
      this.isDraggingEncounter = false;
    } else {
      this.isDraggingAptp = false;
    }
  }

  onDrop(event: DragEvent, type: 'encounter' | 'aptp') {
    event.preventDefault();
    event.stopPropagation();
    
    if (type === 'encounter') {
      this.isDraggingEncounter = false;
    } else {
      this.isDraggingAptp = false;
    }

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (type === 'encounter') {
        if (file.type === 'application/pdf') {
          this.encounterPdfFile = file;
        } else {
          alert('Please drop a valid PDF file.');
        }
      } else {
        if (file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
            file.type === 'text/csv' || 
            file.name.endsWith('.xlsx') || 
            file.name.endsWith('.csv')) {
          this.aptpFormFile = file;
        } else {
          alert('Please drop a valid Excel (.xlsx) or CSV file.');
        }
      }
    }
  }

  removeFile(type: 'encounter' | 'aptp', event: Event) {
    event.stopPropagation();
    if (type === 'encounter') {
      this.encounterPdfFile = null;
      if (this.encounterInput) {
        this.encounterInput.nativeElement.value = '';
      }
    } else {
      this.aptpFormFile = null;
      if (this.aptpInput) {
        this.aptpInput.nativeElement.value = '';
      }
    }
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }

  uploadFiles() {
    if (this.encounterPdfFile && this.aptpFormFile) {
      this.isUploading = true;
      const formData = new FormData();
      formData.append('pdf_file', this.encounterPdfFile);
      formData.append('excel_file', this.aptpFormFile);

      this.http.post('http://localhost:8000/upload/', formData)
        .subscribe({
          next: (res: any) => {
            this.isUploading = false;
            if (res && res.download_url) {
              this.downloadFile(res.download_url, res.extracted_name);
            } else {
              alert('Upload successful but no download URL provided');
            }
          },
          error: (err: any) => {
            this.isUploading = false;
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
