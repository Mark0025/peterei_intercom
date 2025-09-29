import { getOnboardingData } from '@/services/onboarding-data';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function PopoutPage() {
  const onboardingData = getOnboardingData();
  const allQuestions = onboardingData.sections.flatMap(section =>
    section.questions.map((q, index) => ({
      section: section.title,
      questionId: `${section.title.toLowerCase().replace(/\s+/g, '_')}_${index}`,
      ...q
    }))
  );

  return (
    <>
      <h1>Pete Onboarding Full Form</h1>
      <p>Complete all onboarding questions in this comprehensive form.</p>
      
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Onboarding Questionnaire</CardTitle>
        </CardHeader>
        <CardContent>
          <form method="POST" action="/api/popout-submit" className="space-y-6">
            {onboardingData.sections.map((section, sectionIndex) => (
              <div key={section.title} className="space-y-4">
                <h3 className="text-lg font-semibold text-[#2d72d2] border-b pb-2">
                  {section.title}
                </h3>
                {section.questions.map((question, questionIndex) => {
                  const fieldName = `q_${sectionIndex}_${questionIndex}`;
                  return (
                    <div key={fieldName} className="space-y-2">
                      <Label htmlFor={fieldName} className="font-semibold">
                        {question.shorthand}
                      </Label>
                      <p className="text-sm text-gray-600 mb-2">
                        {question.detailed}
                      </p>
                      <Input
                        id={fieldName}
                        name={fieldName}
                        type="text"
                        required
                        className="w-full"
                      />
                    </div>
                  );
                })}
              </div>
            ))}
            
            <div className="pt-4">
              <Button type="submit" size="lg" className="w-full">
                Submit Onboarding Form
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
      
      <div className="mt-6 p-4 bg-gray-100 rounded">
        <p className="text-sm text-gray-600">
          <strong>Note:</strong> This form submits to the server and will send results via email.
          Total questions: <strong>{allQuestions.length}</strong>
        </p>
      </div>
    </>
  );
}