import React, { useState } from 'react';
import { Upload, Mail, FileText, Building, User, Briefcase, Send, ArrowLeft, Check, Loader2 } from 'lucide-react';
import axios from 'axios';
import "./ResumeUpload.scss";

const ResumeUpload = () => {
  const [file, setFile] = useState(null);
  const [companyName, setCompanyName] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [hiringManagerName, setHiringManagerName] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [emailType, setEmailType] = useState('application');
  const [emailBody, setEmailBody] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [successMsg, setSuccessMsg] = useState('');

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setError('');
    setEmailBody('');
    setSuccessMsg('');
  };

  /** STEP 1: Upload resume & generate AI email */
  const handleUpload = async () => {
    if (!file || !companyName || (emailType === 'application' && !jobTitle)) {
      setError('Please fill all required fields.');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('companyName', companyName);
    formData.append('jobTitle', jobTitle);
    formData.append('template', emailType);

    try {
      setLoading(true);
      const res = await axios.post('http://localhost:8080/api/resume/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      // Expecting clean JSON { emailBody: "...generated email..." }
      const generatedBody = res.data.emailBody || res.data;
      setEmailBody(generatedBody.trim());
      setStep(2);
      setLoading(false);
    } catch (err) {
      setLoading(false);
      setError('Upload failed. Make sure the file is a PDF or DOCX.');
    }
  };

  /** STEP 2: Send email using correct API */
  const handleSendEmail = async () => {
    if (!recipientEmail) {
      setError('Please enter the recipient email.');
      return;
    }
    try {
      setLoading(true);

      if (emailType === 'application') {
        await axios.post('http://localhost:8080/api/resume/send_job/email', null, {
          params: {
            to: recipientEmail,
            jobTitle,
            body: emailBody,
          },
        });
      } else {
        await axios.post('http://localhost:8080/api/resume/send/email', null, {
          params: {
            to: recipientEmail,
            companyName,
            hiringManagerName,
            body: emailBody,
          },
        });
      }

      setSuccessMsg('Email sent successfully!');
      setLoading(false);
    } catch (err) {
      setLoading(false);
      setError('Failed to send email. Please try again.');
    }
  };

  const resetForm = () => {
    setStep(1);
    setFile(null);
    setCompanyName('');
    setJobTitle('');
    setHiringManagerName('');
    setRecipientEmail('');
    setEmailBody('');
    setError('');
    setSuccessMsg('');
  };

  return (
    <div className="resume-upload-container">
      <div className="resume-upload">
        {/* Header */}
        <div className="header">
          <div className="header-icon">
            <Mail size={32} />
          </div>
          <h1 className="main-title">AI Cold Email Generator</h1>
          <p className="subtitle">
            Transform your resume into personalized cold emails that get responses. 
            Let AI craft the perfect message for your next opportunity.
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="progress-container">
          <div className="progress-step">
            <div className={`progress-circle ${step >= 1 ? 'active' : ''}`}>
              <FileText size={20} />
            </div>
            <div className={`progress-line ${step >= 2 ? 'active' : ''}`} />
            <div className={`progress-circle ${step >= 2 ? 'active' : ''}`}>
              <Send size={20} />
            </div>
          </div>
        </div>

        {step === 1 && (
          <div className="step-content">
            <div className="step-header">
              <h2>Step 1: Upload & Configure</h2>
              <p>Fill in the details and upload your resume</p>
            </div>

            {/* Email Type Selector */}
            <div className="email-type-section">
              <label className="section-label">Email Type</label>
              <div className="email-type-grid">
                <button
                  onClick={() => setEmailType('application')}
                  className={`email-type-btn ${emailType === 'application' ? 'active' : ''}`}
                >
                  <Briefcase size={24} />
                  <span>Job Application</span>
                </button>
                <button
                  onClick={() => setEmailType('inquiry')}
                  className={`email-type-btn ${emailType === 'inquiry' ? 'active' : ''}`}
                >
                  <User size={24} />
                  <span>Job Inquiry</span>
                </button>
              </div>
            </div>

            {/* Form Fields */}
            <div className="form-fields">
              <div className="input-group">
                <label className="input-label">Company Name *</label>
                <div className="input-with-icon">
                  <Building className="input-icon" size={20} />
                  <input
                    type="text"
                    placeholder="Enter company name"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="form-input"
                  />
                </div>
              </div>

              {emailType === 'application' && (
                <div className="input-group">
                  <label className="input-label">Job Title *</label>
                  <div className="input-with-icon">
                    <Briefcase className="input-icon" size={20} />
                    <input
                      type="text"
                      placeholder="Enter job title"
                      value={jobTitle}
                      onChange={(e) => setJobTitle(e.target.value)}
                      className="form-input"
                    />
                  </div>
                </div>
              )}

              {emailType === 'inquiry' && (
                <div className="input-group">
                  <label className="input-label">Hiring Manager Name</label>
                  <div className="input-with-icon">
                    <User className="input-icon" size={20} />
                    <input
                      type="text"
                      placeholder="Enter manager name (optional)"
                      value={hiringManagerName}
                      onChange={(e) => setHiringManagerName(e.target.value)}
                      className="form-input"
                    />
                  </div>
                </div>
              )}

              {/* File Upload */}
              <div className="input-group">
                <label className="input-label">Resume Upload *</label>
                <div className="file-upload-area">
                  <input
                    type="file"
                    onChange={handleFileChange}
                    accept=".pdf,.docx"
                    className="file-input"
                    id="file-upload"
                  />
                  <label htmlFor="file-upload" className="file-upload-label">
                    <Upload size={32} />
                    <span className="file-text">
                      {file ? file.name : 'Click to upload PDF or DOCX'}
                    </span>
                    <span className="file-subtext">Max file size: 10MB</span>
                  </label>
                </div>
              </div>

              {/* Generate Button */}
              <button
                onClick={handleUpload}
                disabled={loading}
                className="primary-button"
              >
                {loading ? (
                  <div className="button-loading">
                    <Loader2 className="spinner" size={20} />
                    <span>Generating Email...</span>
                  </div>
                ) : (
                  <div className="button-content">
                    <FileText size={20} />
                    <span>Generate AI Email</span>
                  </div>
                )}
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="step-content">
            <div className="step-header-with-back">
              <div className="step-header">
                <h2>Step 2: Review & Send</h2>
                <p>Review the generated email and send it</p>
              </div>
              <button onClick={() => setStep(1)} className="back-button">
                <ArrowLeft size={20} />
                <span>Back</span>
              </button>
            </div>

            <div className="form-fields">
              {/* Email Preview */}
              <div className="input-group">
                <label className="input-label">Generated Email</label>
                <textarea
                  rows={12}
                  value={emailBody}
                  onChange={(e) => setEmailBody(e.target.value)}
                  className="email-textarea"
                  placeholder="Your generated email will appear here..."
                />
              </div>

              {/* Recipient Email */}
              <div className="input-group">
                <label className="input-label">Recipient Email *</label>
                <div className="input-with-icon">
                  <Mail className="input-icon" size={20} />
                  <input
                    type="email"
                    placeholder="Enter recipient email"
                    value={recipientEmail}
                    onChange={(e) => setRecipientEmail(e.target.value)}
                    className="form-input"
                  />
                </div>
              </div>

              {/* Send Button */}
              <button
                onClick={handleSendEmail}
                disabled={loading}
                className="success-button"
              >
                {loading ? (
                  <div className="button-loading">
                    <Loader2 className="spinner" size={20} />
                    <span>Sending Email...</span>
                  </div>
                ) : (
                  <div className="button-content">
                    <Send size={20} />
                    <span>Send Email</span>
                  </div>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Messages */}
        {error && (
          <div className="error-message">
            <p>{error}</p>
          </div>
        )}

        {successMsg && (
          <div className="success-message">
            <div className="success-content">
              <Check size={20} />
              <p>{successMsg}</p>
            </div>
            <button onClick={resetForm} className="reset-button">
              Send another email →
            </button>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="footer">
        <p>Powered by AI • Secure • Professional</p>
      </div>
    </div>
  );
};

export default ResumeUpload;
